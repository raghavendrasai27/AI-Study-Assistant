import os
import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.config import (
    GOOGLE_API_KEY,
    GEMINI_MODEL,
    MAX_SUMMARY_CHUNKS,
    MAX_QUESTION_CHUNKS,
    MAX_QUIZ_CHUNKS,
    MAX_FLASHCARD_CHUNKS
)
from src.models import get_embeddings, ask_gemini
from src.document_loader import compute_file_signature, load_pdf_from_bytes
from src.text_splitter import split_documents
from src.vectorstore import build_vectorstore, retrieve_relevant_docs, format_context_and_sources
from src.prompts import (
    build_qa_prompt,
    build_summary_prompt,
    build_questions_prompt,
    build_quiz_prompt,
    build_flashcards_prompt
)
from src.parsers import parse_flashcards_text, parse_quiz_text, extract_follow_ups

# Initialize FastAPI App
app = FastAPI(
    title="Alex · AI Study Companion API",
    description="Backend API powering the modern React AI Study Companion",
    version="2.0.0"
)

# CORS configuration for Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory App State
state: Dict[str, Any] = {
    "vectorstore": None,
    "documents": [],
    "chunks": [],
    "file_names": [],
    "file_signature": None,
    "messages": [],
    "notes": [],
    "last_quiz": [],
    "last_flashcards": []
}


# Request Models
class ChatRequest(BaseModel):
    question: str
    persona: str = "chill_buddy"
    retrieval_k: int = 4


class SummaryRequest(BaseModel):
    length: str = "Medium"  # "Short", "Medium", "Detailed"


class QuestionsRequest(BaseModel):
    number_questions: int = 5
    difficulty: str = "Mixed"
    question_type: str = "Mixed"


class QuizRequest(BaseModel):
    quiz_size: int = 5


class FlashcardsRequest(BaseModel):
    flashcard_count: int = 8


class NoteItem(BaseModel):
    title: str
    content: str
    tag: Optional[str] = "General"


@app.get("/api/status")
async def get_status():
    """Returns current system and document status."""
    return {
        "configured": bool(GOOGLE_API_KEY),
        "model": GEMINI_MODEL,
        "is_loaded": state["vectorstore"] is not None,
        "file_names": state["file_names"],
        "document_count": len(state["documents"]),
        "chunk_count": len(state["chunks"]),
        "message_count": len(state["messages"]),
        "notes_count": len(state["notes"])
    }


@app.post("/api/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """Uploads and ingests multiple PDF documents into FAISS vectorstore."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    file_tuples = []
    file_signatures = []

    for file in files:
        content = await file.read()
        filename = file.filename or "uploaded.pdf"
        file_tuples.append((filename, content))
        file_signatures.append((filename, len(content)))

    new_signature = tuple(file_signatures)

    # Ingest documents
    all_docs = []
    for filename, content in file_tuples:
        docs = load_pdf_from_bytes(content, filename)
        all_docs.extend(docs)

    if not all_docs:
        raise HTTPException(status_code=400, detail="Could not extract text from the provided PDF(s).")

    chunks = split_documents(all_docs)
    if not chunks:
        raise HTTPException(status_code=400, detail="Could not split document into chunks.")

    try:
        embeddings = get_embeddings()
        vectorstore = build_vectorstore(chunks, embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create FAISS vectorstore: {str(e)}")

    # Update state
    state["vectorstore"] = vectorstore
    state["documents"] = all_docs
    state["chunks"] = chunks
    state["file_names"] = [name for name, _ in file_tuples]
    state["file_signature"] = new_signature
    state["messages"] = []

    return {
        "success": True,
        "message": f"Successfully ingested {len(file_tuples)} document(s) with {len(chunks)} chunks.",
        "file_names": state["file_names"],
        "document_count": len(all_docs),
        "chunk_count": len(chunks)
    }


@app.post("/api/chat")
async def chat_with_alex(req: ChatRequest):
    """Answers student questions using FAISS RAG and humanized Alex persona."""
    if not state["vectorstore"]:
        raise HTTPException(status_code=400, detail="No study material uploaded yet. Please upload a PDF first.")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Record student question in history
    state["messages"].append({
        "role": "user",
        "content": question,
        "timestamp": datetime.datetime.now().isoformat()
    })

    # Retrieve context
    relevant_docs = retrieve_relevant_docs(state["vectorstore"], question, k=req.retrieval_k)
    context, sources = format_context_and_sources(relevant_docs)

    # Format previous conversation
    recent_messages = state["messages"][-6:]
    conversation_text = ""
    for msg in recent_messages:
        conversation_text += f"{msg['role'].upper()}: {msg['content']}\n"

    # Build prompt
    prompt = build_qa_prompt(context, conversation_text, question, persona=req.persona)

    # Generate answer from Gemini
    raw_response = ask_gemini(prompt)

    # Clean text and extract interactive follow-up chips
    main_text, follow_ups = extract_follow_ups(raw_response)

    # If prompt didn't return follow ups, provide sensible contextual defaults
    if not follow_ups:
        follow_ups = [
            "Can you explain this with a real-world analogy?",
            "What's a common exam trap for this topic?",
            "Can you quiz me on this concept?"
        ]

    # Save to history
    assistant_msg = {
        "role": "assistant",
        "content": main_text,
        "sources": sources,
        "follow_ups": follow_ups,
        "persona": req.persona,
        "timestamp": datetime.datetime.now().isoformat()
    }
    state["messages"].append(assistant_msg)

    return {
        "reply": main_text,
        "sources": sources,
        "follow_ups": follow_ups
    }


@app.get("/api/messages")
async def get_messages():
    """Returns conversation history."""
    return {"messages": state["messages"]}


@app.post("/api/summary")
async def generate_summary(req: SummaryRequest):
    """Generates structured revision summary."""
    if not state["chunks"]:
        raise HTTPException(status_code=400, detail="No study material uploaded yet.")

    selected_chunks = state["chunks"][:min(len(state["chunks"]), MAX_SUMMARY_CHUNKS)]
    context = "\n\n".join(doc.page_content for doc in selected_chunks)

    prompt = build_summary_prompt(context, req.length)
    summary = ask_gemini(prompt)

    # Record note
    state["notes"].append({
        "id": len(state["notes"]) + 1,
        "title": f"Revision Summary ({req.length})",
        "content": summary,
        "tag": "Summary",
        "timestamp": datetime.datetime.now().isoformat()
    })

    return {"summary": summary}


@app.post("/api/questions")
async def generate_questions(req: QuestionsRequest):
    """Generates practice questions with explanations."""
    if not state["chunks"]:
        raise HTTPException(status_code=400, detail="No study material uploaded yet.")

    selected_chunks = state["chunks"][:min(len(state["chunks"]), MAX_QUESTION_CHUNKS)]
    context = "\n\n".join(doc.page_content for doc in selected_chunks)

    prompt = build_questions_prompt(context, req.number_questions, req.difficulty, req.question_type)
    questions = ask_gemini(prompt)

    state["notes"].append({
        "id": len(state["notes"]) + 1,
        "title": f"Practice Questions ({req.difficulty})",
        "content": questions,
        "tag": "Practice",
        "timestamp": datetime.datetime.now().isoformat()
    })

    return {"questions": questions}


@app.post("/api/quiz")
async def generate_quiz(req: QuizRequest):
    """Generates an interactive multiple-choice quiz."""
    if not state["chunks"]:
        raise HTTPException(status_code=400, detail="No study material uploaded yet.")

    selected_chunks = state["chunks"][:min(len(state["chunks"]), MAX_QUIZ_CHUNKS)]
    context = "\n\n".join(doc.page_content for doc in selected_chunks)

    prompt = build_quiz_prompt(context, req.quiz_size)
    quiz_raw = ask_gemini(prompt)

    if quiz_raw.startswith("⚠️") or quiz_raw.startswith("❌"):
        raise HTTPException(status_code=500, detail=quiz_raw)

    parsed_quiz = parse_quiz_text(quiz_raw)
    if not parsed_quiz:
        raise HTTPException(status_code=500, detail="Could not parse quiz from model output. Please try again.")

    state["last_quiz"] = parsed_quiz

    return {
        "quiz": parsed_quiz,
        "count": len(parsed_quiz)
    }


@app.post("/api/flashcards")
async def generate_flashcards(req: FlashcardsRequest):
    """Generates an interactive active recall flashcard deck."""
    if not state["chunks"]:
        raise HTTPException(status_code=400, detail="No study material uploaded yet.")

    selected_chunks = state["chunks"][:min(len(state["chunks"]), MAX_FLASHCARD_CHUNKS)]
    context = "\n\n".join(doc.page_content for doc in selected_chunks)

    prompt = build_flashcards_prompt(context, req.flashcard_count)
    cards_raw = ask_gemini(prompt)

    if cards_raw.startswith("⚠️") or cards_raw.startswith("❌"):
        raise HTTPException(status_code=500, detail=cards_raw)

    parsed_cards = parse_flashcards_text(cards_raw)
    if not parsed_cards:
        raise HTTPException(status_code=500, detail="Could not parse flashcards from model output. Please try again.")

    state["last_flashcards"] = parsed_cards

    return {
        "flashcards": parsed_cards,
        "count": len(parsed_cards)
    }


@app.get("/api/notes")
async def get_notes():
    """Returns saved study notes and summaries."""
    return {"notes": state["notes"]}


@app.post("/api/notes")
async def save_note(note: NoteItem):
    """Saves a custom or generated note to the notebook."""
    new_note = {
        "id": len(state["notes"]) + 1,
        "title": note.title,
        "content": note.content,
        "tag": note.tag,
        "timestamp": datetime.datetime.now().isoformat()
    }
    state["notes"].append(new_note)
    return {"success": True, "note": new_note}


@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: int):
    """Deletes a note by ID."""
    state["notes"] = [n for n in state["notes"] if n.get("id") != note_id]
    return {"success": True}


@app.delete("/api/reset")
async def reset_session():
    """Clears all session data and vectorstore."""
    state["vectorstore"] = None
    state["documents"] = []
    state["chunks"] = []
    state["file_names"] = []
    state["file_signature"] = None
    state["messages"] = []
    state["last_quiz"] = []
    state["last_flashcards"] = []
    return {"success": True, "message": "Session reset."}


# Mount built frontend if available
frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=not is_prod)

