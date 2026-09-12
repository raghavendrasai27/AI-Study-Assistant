# 📚 AI Study Assistant

An AI-powered study assistant built with **Streamlit**, **LangChain**, **FAISS**, **HuggingFace Embeddings**, and **Google Gemini**. Upload one or more PDF notes and interact with them through Q&A with citations, automated study summaries, practice question generation, quizzes with answer keys, and flashcards.

---

## 📁 Project Architecture

The codebase is organized into modular components under `src/` to ensure separation of concerns, testability, and clean code:

```
AI_Study_Assistant/
├── app.py                      # Application entry point & workflow orchestrator
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (API keys & model config)
├── .gitignore                  # Git ignore rules
├── README.md                   # Documentation and usage guide
└── src/
    ├── __init__.py             # Package marker
    ├── config.py               # Constants, chunk limits, and .env validation
    ├── models.py               # Cached embeddings & Gemini LLM client with error handling
    ├── document_loader.py      # PDF parsing via PyPDFLoader and metadata attachment
    ├── text_splitter.py        # RecursiveCharacterTextSplitter chunking
    ├── vectorstore.py          # FAISS vector store creation & MMR/similarity search
    ├── prompts.py              # System prompt templates for all 5 study modes
    └── ui/
        ├── __init__.py         # UI package marker
        ├── styles.py           # Page config, custom CSS, header, and footer
        ├── components.py       # Sidebar, document metrics, and export buttons
        └── views.py            # Renderers for Q&A, Summaries, Questions, Quiz, and Flashcards
```

### Module Responsibilities

| Module | Responsibility |
| :--- | :--- |
| [`app.py`](app.py) | High-level orchestrator: loads UI, triggers ingestion pipeline, routes views. |
| [`src/config.py`](src/config.py) | Centralized configuration, chunk sizes, and `.env` loading and verification. |
| [`src/models.py`](src/models.py) | Cached Hugging Face embedding model and Gemini Chat client with error handling. |
| [`src/document_loader.py`](src/document_loader.py) | Safely handles temporary files, loads PDFs, and tags source metadata. |
| [`src/text_splitter.py`](src/text_splitter.py) | Splits documents into chunks with overlap for RAG retrieval. |
| [`src/vectorstore.py`](src/vectorstore.py) | Builds FAISS index and executes MMR (Maximum Marginal Relevance) search. |
| [`src/prompts.py`](src/prompts.py) | Standardized, prompt templates for study tasks. |
| [`src/ui/styles.py`](src/ui/styles.py) | CSS styling, page titles, and layout containers. |
| [`src/ui/components.py`](src/ui/components.py) | Sidebar controls, document metrics, clear/reset buttons, and export section. |
| [`src/ui/views.py`](src/ui/views.py) | Interactive views for the 5 study modes. |

---

## 🚀 Getting Started

### 1. Clone & Navigate to Project

```bash
cd AI_Study_Assistant
```

### 2. Set Up Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate on Windows
.venv\Scripts\activate

# Activate on macOS/Linux
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
# Optional: specify a Gemini model (defaults to gemini-3.6-flash)
GEMINI_MODEL=gemini-3.6-flash
```

### 5. Run the Application

```bash
streamlit run app.py
```

---

## 🎯 Features & Study Modes

1. **💬 Chat & Ask Questions**: Conversational tutoring with Alex, your AI study buddy. Includes quick-start prompt chips, conversation memory, and page-specific citations.
2. **📝 Revision Summary**: High-yield study summaries (Quick Skim, Balanced Revision, or Comprehensive Guide) with exam tips.
3. **❓ Practice Questions**: Active recall questions across difficulty levels with revealable answers.
4. **🧠 Interactive Quiz**: Fully interactive multiple-choice test with answer submission, live scoring, celebration balloons, and explanations.
5. **🗂️ Flashcard Deck**: Interactive card-by-card deck with progress bar, flip-to-reveal answers, and deck shuffling.
6. **📥 Export Material**: Download individual study outputs or bundle all generated notes into a complete study package.
