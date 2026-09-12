import os
from pathlib import Path
import streamlit as st
from dotenv import load_dotenv

# Base paths
SRC_DIR = Path(__file__).resolve().parent
ROOT_DIR = SRC_DIR.parent
ENV_PATH = ROOT_DIR / ".env"

# Load environment variables
load_dotenv(dotenv_path=ENV_PATH)

# API Keys & Model Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Document Chunking Settings
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
CHUNK_SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

# Context limits for generation modes
MAX_SUMMARY_CHUNKS = 40
MAX_QUESTION_CHUNKS = 40
MAX_QUIZ_CHUNKS = 30
MAX_FLASHCARD_CHUNKS = 40

def validate_config() -> bool:
    """Validates required environment configuration."""
    if not GOOGLE_API_KEY:
        st.error("❌ GOOGLE_API_KEY not found.")
        st.info(
            "Create a .env file in the project root folder with:\n\n"
            "GOOGLE_API_KEY=your_api_key_here"
        )
        st.stop()
        return False
    return True
