import random
import re
from typing import List, Dict, Any
import streamlit as st
from langchain_core.documents import Document
from src.config import (
    MAX_SUMMARY_CHUNKS,
    MAX_QUESTION_CHUNKS,
    MAX_QUIZ_CHUNKS,
    MAX_FLASHCARD_CHUNKS
)
from src.models import ask_gemini
from src.vectorstore import retrieve_relevant_docs, format_context_and_sources
from src.prompts import (
    build_qa_prompt,
    build_summary_prompt,
    build_questions_prompt,
    build_quiz_prompt,
    build_flashcards_prompt
)


# ============================================================
# HELPER PARSERS
# ============================================================

def parse_flashcards_text(text: str) -> List[Dict[str, str]]:
    """Parses raw LLM flashcards markdown into structured card dictionaries."""
    cards = []
    blocks = re.split(r'###\s*Card\s*\d+', text, flags=re.IGNORECASE)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        q_match = re.search(r'\*\*Question:\*\*\s*(.+?)(?=\*\*Answer:|\n\n|$)', block, re.DOTALL | re.IGNORECASE)
        a_match = re.search(r'\*\*Answer:\*\*\s*(.+?)(?=\*\*Key Takeaway:|\n\n|$)', block, re.DOTALL | re.IGNORECASE)
        t_match = re.search(r'\*\*Topic:\*\*\s*(.+?)(?=\*\*Question:|\n|$)', block, re.DOTALL | re.IGNORECASE)
        k_match = re.search(r'\*\*Key Takeaway:\*\*\s*(.+?)(?=$)', block, re.DOTALL | re.IGNORECASE)

        if q_match and a_match:
            cards.append({
                "topic": t_match.group(1).strip() if t_match else "Core Concept",
                "question": q_match.group(1).strip(),
                "answer": a_match.group(1).strip(),
                "takeaway": k_match.group(1).strip() if k_match else ""
            })
    return cards


def parse_quiz_text(text: str) -> List[Dict[str, Any]]:
    """Parses raw LLM quiz markdown into structured question dictionaries."""
    questions = []
    blocks = re.split(r'###\s*Question\s*\d+', text, flags=re.IGNORECASE)
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        c_match = re.search(r'Correct:\s*([A-D])', block, re.IGNORECASE)
        e_match = re.search(r'Explanation:\s*(.+)', block, re.DOTALL | re.IGNORECASE)

        lines = block.split('\n')
        opts = {}
        for line in lines:
            m = re.match(r'([A-D])\)\s*(.+)', line.strip())
            if m:
                opts[m.group(1).upper()] = m.group(2).strip()

        q_lines = []
        for line in lines:
            if re.match(r'^[A-D]\)', line.strip()) or 'Correct:' in line or 'Explanation:' in line:
                break
            if line.strip():
                q_lines.append(line.strip())
        q_text = " ".join(q_lines)

        if c_match and len(opts) >= 2:
            questions.append({
                "question": q_text,
                "options": opts,
                "correct": c_match.group(1).upper(),
                "explanation": e_match.group(1).strip() if e_match else "Based on your study notes."
            })
    return questions


# ============================================================
# 1. CHAT & Q&A VIEW
# ============================================================

def render_qa_view(vectorstore, retrieval_k: int):
    """Renders the conversational Q&A interface with Alex the AI study buddy."""
    st.markdown("### 💬 Chat with Alex")
    st.caption("Ask anything about your notes. Alex answers using your study material and cites page numbers.")

    # Starter prompts for empty state
    if not st.session_state.messages:
        st.markdown(
            """
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                <div style="font-weight: 700; font-size: 15px; color: #1e293b; margin-bottom: 6px;">
                    👋 What would you like to study first?
                </div>
                <div style="font-size: 13.5px; color: #64748b; margin-bottom: 14px;">
                    Pick a starter question below or type your own question in the chat bar below:
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        col1, col2 = st.columns(2)
        starter_prompts = [
            ("💡 Summarize the core concepts", "Summarize the most important themes and concepts from my notes."),
            ("🔑 Key definitions to memorize", "What are the most important terms and definitions I need to know?"),
            ("🎯 Likely exam topics", "Based on this material, what are the most likely exam questions or topics?"),
            ("🧠 Explain like I'm 5", "Can you explain the main theme of these notes in simple, intuitive terms with an analogy?")
        ]

        for i, (label, query) in enumerate(starter_prompts):
            target_col = col1 if i % 2 == 0 else col2
            with target_col:
                if st.button(label, key=f"starter_{i}", use_container_width=True):
                    st.session_state.pending_question = query
                    st.rerun()

    # Display chat history
    for message in st.session_state.messages:
        avatar = "🦉" if message["role"] == "assistant" else "🎓"
        with st.chat_message(message["role"], avatar=avatar):
            st.markdown(message["content"])
            if "sources" in message and message["sources"]:
                with st.expander("📖 Sources from your notes"):
                    for source in message["sources"]:
                        st.markdown(f'<span class="source-badge">{source}</span>', unsafe_allow_html=True)

    # Chat input or pending question trigger
    input_question = st.chat_input("Ask Alex a question about your study notes...")
    active_question = None

    if st.session_state.get("pending_question"):
        active_question = st.session_state.pending_question
        st.session_state.pending_question = None
    elif input_question:
        active_question = input_question

    if active_question:
        # Display user message
        with st.chat_message("user", avatar="🎓"):
            st.markdown(active_question)

        st.session_state.messages.append({"role": "user", "content": active_question})

        # Generate response
        with st.chat_message("assistant", avatar="🦉"):
            with st.spinner("🔍 Flipping through your notes..."):
                relevant_documents = retrieve_relevant_docs(
                    vectorstore, active_question, k=retrieval_k
                )

            context, sources = format_context_and_sources(relevant_documents)

            previous_messages = st.session_state.messages[-6:]
            conversation = ""
            for msg in previous_messages:
                conversation += f"{msg['role'].upper()}: {msg['content']}\n"

            prompt = build_qa_prompt(context, conversation, active_question)

            with st.spinner("🦉 Alex is thinking..."):
                answer = ask_gemini(prompt)

            st.markdown(answer)

            if sources:
                with st.expander("📖 Sources from your notes"):
                    for source in sources:
                        st.markdown(f'<span class="source-badge">{source}</span>', unsafe_allow_html=True)

        st.session_state.messages.append({
            "role": "assistant",
            "content": answer,
            "sources": sources
        })


# ============================================================
# 2. REVISION SUMMARY VIEW
# ============================================================

def render_summary_view(chunks: List[Document]):
    """Renders the study notes summarization interface."""
    st.markdown("### 📝 Smart Revision Summary")
    st.caption("Generate high-yield summaries designed for fast retention and exam prep.")

    summary_type = st.radio(
        "Select summary depth:",
        [
            "⚡ Quick Skim (High-yield key takeaways & definitions)",
            "⚖️ Balanced Revision (Key themes, core methods, and conclusions)",
            "🔬 Comprehensive Guide (Deep-dive breakdown with step-by-step concepts)"
        ],
        index=1
    )

    length_map = {
        "⚡ Quick Skim (High-yield key takeaways & definitions)": "Short",
        "⚖️ Balanced Revision (Key themes, core methods, and conclusions)": "Medium",
        "🔬 Comprehensive Guide (Deep-dive breakdown with step-by-step concepts)": "Detailed"
    }
    selected_length = length_map[summary_type]

    if st.button("✨ Generate Study Summary", type="primary", use_container_width=False):
        selected_chunks = chunks[:min(len(chunks), MAX_SUMMARY_CHUNKS)]
        context = "\n\n".join(doc.page_content for doc in selected_chunks)

        prompt = build_summary_prompt(context, selected_length)

        with st.spinner("☕ Alex is brewing your revision summary..."):
            summary = ask_gemini(prompt)

        st.markdown(summary)
        st.session_state.generated_notes.append(("Revision Summary", summary))

        st.download_button(
            "📥 Download Summary (.txt)",
            data=summary,
            file_name="study_summary.txt",
            mime="text/plain"
        )


# ============================================================
# 3. PRACTICE QUESTIONS VIEW
# ============================================================

def render_questions_view(chunks: List[Document]):
    """Renders practice questions with revealable explanations."""
    st.markdown("### ❓ Practice Questions")
    st.caption("Test your recall with custom questions tailored to your study material.")

    col1, col2, col3 = st.columns(3)
    with col1:
        number_questions = st.slider("Number of questions", min_value=3, max_value=15, value=6)
    with col2:
        difficulty = st.selectbox("Difficulty level", ["Mixed", "Easy", "Medium", "Hard"])
    with col3:
        question_type = st.selectbox("Question type", ["Mixed", "Short Answer", "Multiple Choice Questions"])

    if st.button("✍️ Create Practice Questions", type="primary"):
        selected_chunks = chunks[:min(len(chunks), MAX_QUESTION_CHUNKS)]
        context = "\n\n".join(doc.page_content for doc in selected_chunks)

        prompt = build_questions_prompt(context, number_questions, difficulty, question_type)

        with st.spinner("✍️ Alex is drafting practice questions..."):
            questions = ask_gemini(prompt)

        st.markdown(questions)
        st.session_state.generated_notes.append(("Practice Questions", questions))

        st.download_button(
            "📥 Download Practice Questions (.txt)",
            data=questions,
            file_name="practice_questions.txt",
            mime="text/plain"
        )


# ============================================================
# 4. INTERACTIVE QUIZ VIEW
# ============================================================

def render_quiz_view(chunks: List[Document]):
    """Renders an interactive, self-scoring quiz experience."""
    st.markdown("### 🧠 Interactive Self-Test Quiz")
    st.caption("Challenge yourself with an interactive multiple-choice quiz. Select answers and get instant feedback!")

    col1, col2 = st.columns([2, 1])
    with col1:
        quiz_size = st.slider("Quiz Size (Number of Questions)", 3, 10, 5)
    with col2:
        st.write("")
        st.write("")
        generate_btn = st.button("🎯 Generate New Quiz", type="primary", use_container_width=True)

    if generate_btn:
        selected_chunks = chunks[:min(len(chunks), MAX_QUIZ_CHUNKS)]
        context = "\n\n".join(doc.page_content for doc in selected_chunks)

        prompt = build_quiz_prompt(context, quiz_size)

        with st.spinner("🎯 Crafting your quiz..."):
            quiz_raw = ask_gemini(prompt)

        parsed_quiz = parse_quiz_text(quiz_raw)
        st.session_state.quiz_data = parsed_quiz
        st.session_state.quiz_submitted = False
        st.session_state.quiz_user_answers = {}
        st.session_state.generated_notes.append(("Quiz", quiz_raw))

    # Display interactive quiz if available
    if st.session_state.quiz_data:
        quiz = st.session_state.quiz_data
        st.markdown(f"**Answer the {len(quiz)} questions below:**")

        for idx, q in enumerate(quiz):
            st.markdown(
                f"""
                <div class="quiz-card">
                    <div class="quiz-q-title">Q{idx + 1}. {q['question']}</div>
                </div>
                """,
                unsafe_allow_html=True
            )

            options_keys = sorted(q["options"].keys())
            options_labels = [f"{k}) {q['options'][k]}" for k in options_keys]

            # Render radio options
            selected_label = st.radio(
                f"Options for Q{idx + 1}",
                options_labels,
                key=f"quiz_opt_{idx}",
                label_visibility="collapsed",
                index=None if not st.session_state.quiz_submitted else options_keys.index(
                    st.session_state.quiz_user_answers.get(idx, options_keys[0])
                ) if st.session_state.quiz_user_answers.get(idx) in options_keys else None,
                disabled=st.session_state.quiz_submitted
            )

            if selected_label:
                chosen_letter = selected_label.split(")")[0].strip()
                st.session_state.quiz_user_answers[idx] = chosen_letter

            # Feedback when submitted
            if st.session_state.quiz_submitted:
                user_choice = st.session_state.quiz_user_answers.get(idx)
                is_correct = user_choice == q["correct"]
                if is_correct:
                    st.success(f"✅ Correct! Option {q['correct']}")
                else:
                    st.error(f"❌ Incorrect. Your choice: {user_choice or 'None'} | Correct: Option {q['correct']}")

                st.markdown(
                    f"""
                    <div class="quiz-explanation">
                        💡 <b>Explanation:</b> {q['explanation']}
                    </div>
                    """,
                    unsafe_allow_html=True
                )

        col_sub, col_reset = st.columns([1, 1])
        with col_sub:
            if not st.session_state.quiz_submitted:
                if st.button("🚀 Submit Quiz & View Score", type="primary", use_container_width=True):
                    st.session_state.quiz_submitted = True
                    # Calculate score
                    score = sum(
                        1 for i, q in enumerate(quiz)
                        if st.session_state.quiz_user_answers.get(i) == q["correct"]
                    )
                    pct = (score / len(quiz)) * 100
                    if pct >= 80:
                        st.balloons()
                    st.rerun()

        with col_reset:
            if st.session_state.quiz_submitted:
                score = sum(
                    1 for i, q in enumerate(quiz)
                    if st.session_state.quiz_user_answers.get(i) == q["correct"]
                )
                st.info(f"🏆 **Your Score:** {score} / {len(quiz)} ({int((score/len(quiz))*100)}%)")
                if st.button("🔄 Retake Quiz", use_container_width=True):
                    st.session_state.quiz_submitted = False
                    st.session_state.quiz_user_answers = {}
                    st.rerun()


# ============================================================
# 5. INTERACTIVE FLASHCARD DECK VIEW
# ============================================================

def render_flashcards_view(chunks: List[Document]):
    """Renders an interactive card-by-card flashcard deck viewer."""
    st.markdown("### 🗂️ Interactive Flashcard Deck")
    st.caption("Active recall study deck with flip-to-reveal answers and card navigation.")

    col1, col2 = st.columns([2, 1])
    with col1:
        flashcard_count = st.slider("Deck Size", min_value=3, max_value=20, value=8)
    with col2:
        st.write("")
        st.write("")
        gen_deck_btn = st.button("✨ Generate Flashcard Deck", type="primary", use_container_width=True)

    if gen_deck_btn:
        selected_chunks = chunks[:min(len(chunks), MAX_FLASHCARD_CHUNKS)]
        context = "\n\n".join(doc.page_content for doc in selected_chunks)

        prompt = build_flashcards_prompt(context, flashcard_count)

        with st.spinner("🗂️ Alex is creating your flashcards..."):
            cards_raw = ask_gemini(prompt)

        parsed_cards = parse_flashcards_text(cards_raw)
        st.session_state.flashcards_deck = parsed_cards
        st.session_state.current_card_index = 0
        st.session_state.show_card_answer = False
        st.session_state.generated_notes.append(("Flashcards", cards_raw))

    # Display interactive deck if available
    deck = st.session_state.flashcards_deck
    if deck:
        idx = st.session_state.current_card_index
        if idx >= len(deck):
            idx = 0
            st.session_state.current_card_index = 0

        card = deck[idx]

        # Progress indicator
        st.progress((idx + 1) / len(deck))
        st.markdown(
            f"<div style='text-align: center; color: #64748b; font-weight: 600; font-size: 14px;'>Card {idx + 1} of {len(deck)}</div>",
            unsafe_allow_html=True
        )

        # Card container
        st.markdown(
            f"""
            <div class="flashcard-wrapper">
                <div class="flashcard-box">
                    <span class="flashcard-badge">🏷️ {card['topic']}</span>
                    <div class="flashcard-question">{card['question']}</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

        # Flip / Reveal button
        col_c1, col_c2, col_c3 = st.columns([1, 2, 1])
        with col_c2:
            flip_label = "🙈 Hide Answer" if st.session_state.show_card_answer else "💡 Reveal Answer"
            if st.button(flip_label, use_container_width=True):
                st.session_state.show_card_answer = not st.session_state.show_card_answer
                st.rerun()

        # Display answer if revealed
        if st.session_state.show_card_answer:
            st.markdown(
                f"""
                <div style="max-width: 680px; margin: 0 auto 20px auto;">
                    <div class="flashcard-answer-box">
                        <div style="font-weight: 700; color: #166534; font-size: 14px; margin-bottom: 4px;">✅ Answer:</div>
                        <div class="flashcard-answer-text">{card['answer']}</div>
                        {f'<div class="flashcard-takeaway">💡 <b>Takeaway:</b> {card["takeaway"]}</div>' if card.get("takeaway") else ''}
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

        # Stepper navigation controls
        nav_prev, nav_shuffle, nav_next = st.columns([1, 1, 1])
        with nav_prev:
            if st.button("⬅️ Previous Card", disabled=(idx == 0), use_container_width=True):
                st.session_state.current_card_index = max(0, idx - 1)
                st.session_state.show_card_answer = False
                st.rerun()

        with nav_shuffle:
            if st.button("🔀 Shuffle Deck", use_container_width=True):
                random.shuffle(st.session_state.flashcards_deck)
                st.session_state.current_card_index = 0
                st.session_state.show_card_answer = False
                st.rerun()

        with nav_next:
            if st.button("Next Card ➡️", disabled=(idx == len(deck) - 1), use_container_width=True):
                st.session_state.current_card_index = min(len(deck) - 1, idx + 1)
                st.session_state.show_card_answer = False
                st.rerun()
