"""
Automated end-to-end verification script for Alex AI Study Companion API.
Tests:
- API Status
- PDF Document Upload and FAISS vector indexing
- Conversational RAG with citation and follow-up parsing
- Structured Quiz parsing and verification
- Structured Flashcards parsing and verification
- Smart Summary generation
"""
import os
import sys
from pathlib import Path

# Fix Windows cp1252 console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from starlette.testclient import TestClient
from server import app

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("🚀 Starting Alex AI Study Companion System Tests")
    print("==================================================")

    # 1. Status Check (Empty state)
    print("\n[1/6] Testing GET /api/status (Initial)...")
    res = client.get("/api/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    data = res.json()
    print(f"✅ Status response: model={data.get('model')}, is_loaded={data.get('is_loaded')}")

    # 2. Upload Document
    pdf_path = Path("sample_course_notes.pdf")
    assert pdf_path.exists(), "sample_course_notes.pdf does not exist"
    
    print(f"\n[2/6] Testing POST /api/upload with {pdf_path}...")
    with open(pdf_path, "rb") as f:
        files = [("files", (pdf_path.name, f.read(), "application/pdf"))]
        res = client.post("/api/upload", files=files)
    
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    print(f"✅ Upload succeeded: {data.get('document_count')} pages, {data.get('chunk_count')} chunks")

    # 3. Status Check (Loaded state)
    res = client.get("/api/status")
    data = res.json()
    assert data["is_loaded"] is True, "Vectorstore should be loaded"
    assert data["chunk_count"] > 0, "Chunks count should be > 0"
    print(f"✅ Verified loaded state: {data['chunk_count']} chunks indexed in FAISS")

    # 4. Chat with Alex
    print("\n[3/6] Testing POST /api/chat with 'What is the vanishing gradient problem and how does ReLU solve it?'...")
    chat_payload = {
        "question": "What is the vanishing gradient problem and how does ReLU solve it?",
        "persona": "chill_buddy",
        "retrieval_k": 3
    }
    res = client.post("/api/chat", json=chat_payload)
    assert res.status_code == 200, f"Chat failed: {res.text}"
    chat_data = res.json()
    assert "reply" in chat_data and len(chat_data["reply"]) > 20, "Expected non-empty reply"
    assert "sources" in chat_data and len(chat_data["sources"]) > 0, "Expected source citations"
    assert "follow_ups" in chat_data and len(chat_data["follow_ups"]) > 0, "Expected follow-up suggestions"
    
    print("✅ Chat succeeded!")
    print(f"Sources cited: {chat_data['sources']}")
    print(f"Suggested follow-ups: {chat_data['follow_ups']}")
    print(f"Alex's reply preview: {chat_data['reply'][:150]}...")

    import time
    time.sleep(1.5)

    # 5. Interactive Quiz
    print("\n[4/6] Testing POST /api/quiz (3 questions)...")
    quiz_payload = {"quiz_size": 3}
    res = client.post("/api/quiz", json=quiz_payload)
    assert res.status_code == 200, f"Quiz generation failed: {res.text}"
    quiz_data = res.json()
    assert "quiz" in quiz_data and len(quiz_data["quiz"]) >= 2, "Expected structured quiz questions"
    q1 = quiz_data["quiz"][0]
    assert "question" in q1 and "options" in q1 and "correct" in q1 and "explanation" in q1
    print(f"✅ Quiz succeeded: Generated {len(quiz_data['quiz'])} multiple choice questions")
    print(f"Sample Q1: {q1['question']}")
    print(f"Correct answer: Option {q1['correct']} -> {q1['options'].get(q1['correct'])}")

    time.sleep(1.5)

    # 6. Flashcard Deck
    print("\n[5/6] Testing POST /api/flashcards (4 cards)...")
    flash_payload = {"flashcard_count": 4}
    res = client.post("/api/flashcards", json=flash_payload)
    assert res.status_code == 200, f"Flashcards failed: {res.text}"
    flash_data = res.json()
    assert "flashcards" in flash_data and len(flash_data["flashcards"]) >= 2, "Expected structured flashcards"
    c1 = flash_data["flashcards"][0]
    assert "topic" in c1 and "question" in c1 and "answer" in c1
    print(f"✅ Flashcards succeeded: Generated {len(flash_data['flashcards'])} cards")
    print(f"Sample Card: [{c1['topic']}] Q: {c1['question']} | A: {c1['answer']}")

    time.sleep(1.5)

    # 7. Summary
    print("\n[6/6] Testing POST /api/summary (Short)...")
    sum_payload = {"length": "Short"}
    res = client.post("/api/summary", json=sum_payload)
    assert res.status_code == 200, f"Summary failed: {res.text}"
    sum_data = res.json()
    assert "summary" in sum_data and len(sum_data["summary"]) > 50
    print("✅ Summary succeeded!")

    print("\n==================================================")
    print("🎉 ALL ENDPOINTS VERIFIED & WORKING BEAUTIFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
