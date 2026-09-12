from typing import List, Tuple, Any
import streamlit as st


def init_session_state():
    """Initializes Streamlit session state variables if they do not exist."""
    defaults = {
        "vectorstore": None,
        "messages": [],
        "file_signature": None,
        "file_names": [],
        "documents": [],
        "chunks": [],
        "generated_notes": [],
        # Interactive flashcards state
        "flashcards_deck": [],
        "current_card_index": 0,
        "show_card_answer": False,
        # Interactive quiz state
        "quiz_data": [],
        "quiz_submitted": False,
        "quiz_user_answers": {},
        # Starter prompt selection
        "pending_question": None
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


def render_sidebar() -> Tuple[str, Any, int]:
    """
    Renders the sidebar controls for study mode selection, PDF uploading,
    retrieval configuration, and session resetting.
    """
    with st.sidebar:
        st.markdown("### 🎓 Study Control Center")

        st.markdown("**Choose Your Study Mode**")
        study_mode = st.radio(
            "Study Mode",
            [
                "💬 Chat & Ask Questions",
                "📝 Revision Summary",
                "❓ Practice Questions",
                "🧠 Interactive Quiz",
                "🗂️ Flashcard Deck"
            ],
            label_visibility="collapsed"
        )

        st.divider()

        st.markdown("### 📚 Study Material")
        uploaded_files = st.file_uploader(
            "Upload lecture notes, slides, or chapters",
            type=["pdf"],
            accept_multiple_files=True,
            help="Upload PDF files you want Alex to learn from."
        )

        st.divider()

        with st.expander("⚙️ Advanced Retrieval Settings", expanded=False):
            retrieval_k = st.slider(
                "Source excerpts to retrieve per question",
                min_value=2,
                max_value=8,
                value=4,
                help="Higher values give more context but take slightly longer to process."
            )

        st.divider()

        st.markdown("**Session Actions**")
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🗑️ Clear Chat", use_container_width=True):
                st.session_state.messages = []
                st.session_state.pending_question = None
                st.rerun()

        with col2:
            if st.button("🔄 Reset All", use_container_width=True):
                st.session_state.vectorstore = None
                st.session_state.documents = []
                st.session_state.chunks = []
                st.session_state.file_names = []
                st.session_state.file_signature = None
                st.session_state.messages = []
                st.session_state.generated_notes = []
                st.session_state.flashcards_deck = []
                st.session_state.quiz_data = []
                st.session_state.quiz_submitted = False
                st.session_state.quiz_user_answers = {}
                st.session_state.pending_question = None
                st.rerun()

    return study_mode, uploaded_files, retrieval_k


def render_document_metrics(file_names: List[str], documents: List[Any], chunks: List[Any]):
    """Renders a warm, visually attractive document status card."""
    doc_chips = "".join([f'<span class="source-badge">📄 {fn}</span>' for fn in file_names])
    st.markdown(
        f"""
        <div class="metrics-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <div style="font-weight: 700; font-size: 16px; color: #166534; display: flex; align-items: center; gap: 8px;">
                        <span>🟢</span> Study Material Ready!
                    </div>
                    <div style="margin-top: 6px;">{doc_chips}</div>
                </div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <div class="metric-pill">📑 {len(file_names)} File(s)</div>
                    <div class="metric-pill">📖 {len(documents)} Pages</div>
                    <div class="metric-pill">🧩 {len(chunks)} Chunks</div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_no_document_notice():
    """Renders a warm empty state encouraging the student to upload materials."""
    st.markdown(
        """
        <div style="text-align: center; padding: 48px 20px; background: #faf5ff; border: 2px dashed #d8b4fe; border-radius: 20px; margin: 30px 0;">
            <div style="font-size: 48px; margin-bottom: 12px;">👋 🦉</div>
            <h3 style="color: #581c87; margin-bottom: 8px; font-weight: 800;">Hey there! I'm Alex, your AI study buddy.</h3>
            <p style="color: #6b21a8; font-size: 16px; max-width: 540px; margin: 0 auto 20px auto; line-height: 1.5;">
                Upload your course syllabus, PDF slides, or lecture notes on the sidebar to get started. Once uploaded, we can discuss key concepts, generate study summaries, or quiz your knowledge!
            </p>
            <div style="font-size: 14px; color: #7e22ce; font-weight: 600;">
                👈 Click "Upload PDF files" on the left sidebar to begin
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_export_section(generated_notes: List[Tuple[str, str]]):
    """Renders a clean section allowing the student to download all generated notes combined."""
    if not generated_notes:
        return

    st.divider()
    st.markdown("### 📥 Save Your Study Material")
    st.caption("Keep your revision notes, summaries, practice questions, and flashcards for offline exam prep.")

    combined_notes = ""
    for title, content in generated_notes:
        combined_notes += (
            "\n\n"
            + "=" * 60
            + "\n"
            + f"📌 {title.upper()}"
            + "\n"
            + "=" * 60
            + "\n\n"
            + content
            + "\n"
        )

    st.download_button(
        "📥 Download Full Study Package (.txt)",
        data=combined_notes,
        file_name="alex_study_notes.txt",
        mime="text/plain",
        use_container_width=False
    )
