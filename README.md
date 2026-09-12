# 📚 Alex · AI Study Companion

An interactive, AI-powered study partner built with **Streamlit**, **LangChain**, **FAISS**, and **Google Gemini**. Upload course PDFs and study smarter with conversational tutoring, interactive quizzes, flashcards, and revision notes.

---

## ⚡ Quickstart

```bash
# 1. Setup virtual environment & install dependencies
python -m venv .venv
.venv\Scripts\activate       # On macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# 2. Add your Gemini API key in .env
# GOOGLE_API_KEY=your_api_key_here
# GEMINI_MODEL=gemini-3.6-flash

# 3. Launch the app
streamlit run app.py
```

---

## 🎯 Key Features

- **💬 Conversational Q&A**: Chat with Alex using your notes with accurate page citations and starter prompts.
- **📝 Smart Summaries**: Generate high-yield revision sheets (Quick Skim, Balanced, or In-depth).
- **❓ Practice Questions**: Create customized practice questions with revealable answers and explanations.
- **🧠 Interactive Quiz**: Multiple-choice self-test with live scoring, answer keys, and celebration effects.
- **🗂️ Flashcard Deck**: Active recall deck with flip-to-reveal answers, card navigation, and shuffling.
- **📥 Export Material**: Download all generated notes in a single study file for offline revision.

---

## 🏗️ Project Structure

```
AI_Study_Assistant/
├── app.py                  # Streamlit entry point & coordinator
├── requirements.txt        # Project dependencies
├── .env                    # API key & model settings
└── src/
    ├── config.py           # Configuration & environment validation
    ├── models.py           # Gemini 3.6 Flash & HuggingFace embeddings
    ├── document_loader.py  # PDF processing & source metadata
    ├── text_splitter.py    # Recursive document chunking
    ├── vectorstore.py      # FAISS vector database & MMR retrieval
    ├── prompts.py          # Tutor prompt templates
    └── ui/
        ├── styles.py       # Custom CSS & layout styling
        ├── components.py   # Sidebar, metrics, & export controls
        └── views.py        # Mode views (Chat, Summary, Quiz, Flashcards)
```

---

## 🛠️ Tech Stack

- **Frontend**: Streamlit
- **LLM**: Google Gemini (`gemini-3.6-flash`) via `langchain-google-genai`
- **Vector Store**: FAISS (`faiss-cpu`) with MMR search
- **Embeddings**: HuggingFace `all-MiniLM-L6-v2`
- **PDF Extraction**: `pypdf` & `langchain-community`
