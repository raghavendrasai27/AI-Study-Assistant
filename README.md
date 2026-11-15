# 📚 Alex · AI Study Companion (React + FastAPI)

An empathetic, interactive AI study partner and peer mentor built with **React**, **FastAPI**, **LangChain**, **FAISS**, and **Google Gemini**. Upload course lecture slides and PDFs to study smarter with conversational tutoring, text-to-speech voice read-aloud, 3D flip flashcards, gamified quizzes with celebratory confetti, and a built-in Pomodoro focus companion.

---

## ⚡ Quickstart

### 1. Backend Setup & Dependencies

```bash
# Activate virtual environment
.venv\Scripts\activate       # On macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Ensure your `.env` contains:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```

### 2. Launch the Application

#### Option A: Single Command (FastAPI serves built React frontend)
```bash
python server.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser!

#### Option B: Development Mode (Vite Hot-Reloading + FastAPI Backend)
- **Terminal 1 (Backend API)**:
  ```bash
  python server.py
  ```
- **Terminal 2 (React Vite Dev Server)**:
  ```bash
  cd frontend
  npm run dev
  ```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

*(Note: The legacy Streamlit interface remains available via `streamlit run app.py`.)*

---

## 🌟 Humanized Features

Studying can feel overwhelming and isolated. Alex is designed around human empathy and active cognitive engagement:

- **🦉 Expressive Companion Avatar**: Real-time mood states (Ready, Reading Notes, Thinking, Explaining, Celebrating, Taking a Break) with rotating study motivation nudges.
- **☕ Alex Persona Modes**:
  - **☕ Chill Study Buddy**: Warm, relatable analogies, plain English intuition, and high-fives.
  - **⚡ Exam Sprint Coach**: High-yield exam traps, memory hooks, and must-know formulas.
  - **🎓 Socratic Mentor**: Thought-provoking guiding questions to deepen conceptual intuition.
- **🔊 Multimodal Voice & Audio**:
  - **Read Aloud (TTS)**: Listen to explanations and flashcards out loud using browser speech synthesis while resting tired eyes.
  - **Voice Dictation (STT)**: Ask questions using your voice via microphone input.
- **🗂️ 3D Tactile Flip Flashcards**:
  - Realistic 3D card flip physics.
  - Keyboard shortcuts (`Space` to flip, `Arrow` keys to navigate, `1-3` to rate recall ease).
  - Leitner-style mastery tracking (Hard, Good, Mastered) and deck shuffle.
- **🧠 Interactive Quiz with Celebration Confetti**:
  - Instant multiple-choice scoring with celebratory confetti bursts on high scores.
  - Detailed explanations and key takeaways for every question.
- **⏱️ Study Sprint Pomodoro Timer**:
  - 25-minute focus session / 5-minute break timer with synthesized warm bell chime notifications.
  - Mindful break guidance (posture stretch, eye rest, hydration).
- **📓 Personal Revision Notebook**:
  - 1-click save insights from Chat, Summaries, or Practice Sets.
  - Export a consolidated Markdown revision pack (`.md`) for offline study.

---

## 🏗️ Project Structure

```
AI_Study_Assistant/
├── frontend/                 # React 18 + Vite + Tailwind CSS + Lucide
│   ├── src/
│   │   ├── api/client.js     # API client for FastAPI backend
│   │   ├── components/       # Navbar, Sidebar, AlexCompanion, PomodoroTimer
│   │   ├── views/            # ChatView, SummaryView, QuestionsView, QuizView, FlashcardsView, NotebookView
│   │   ├── App.jsx           # Main UI shell and state coordinator
│   │   └── index.css         # Tailwind directives & 3D card flip utilities
│   ├── dist/                 # Production-built bundle served by FastAPI
│   ├── package.json
│   └── vite.config.js        # Vite config with API proxy
├── server.py                 # FastAPI backend server
├── app.py                    # Legacy Streamlit app (kept intact)
├── requirements.txt          # Python dependencies
├── .env                      # Gemini API keys
├── sample_course_notes.pdf   # 4-page synthetic Machine Learning study guide
└── src/
    ├── config.py             # Configuration loader
    ├── models.py             # Gemini LLM & HuggingFace embeddings
    ├── document_loader.py    # Multi-PDF parser & metadata tagger
    ├── text_splitter.py      # Recursive document chunking
    ├── vectorstore.py        # FAISS vector store with MMR retrieval
    ├── prompts.py            # Humanized tutor prompts with persona profiles
    └── parsers.py            # Resilient flashcards, quiz, and follow-up parsers
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas-Confetti, Web Speech API (TTS & STT), Web Audio API
- **Backend**: FastAPI, Uvicorn, Python Multipart, Pydantic
- **LLM**: Google Gemini (`gemini-3.6-flash`) via `langchain-google-genai`
- **Vector Store**: FAISS (`faiss-cpu`) with Maximum Marginal Relevance (MMR) search
- **Embeddings**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2`
- **PDF Extraction**: `pypdf` & `langchain-community`
