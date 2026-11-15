import io
import uuid
import logging
from pathlib import Path
from typing import List, Tuple, Any, Union
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from src.config import ROOT_DIR

logger = logging.getLogger(__name__)


def compute_file_signature(uploaded_files: Any) -> Tuple[Tuple[str, int], ...]:
    """Generates a unique signature for the set of uploaded files based on name and size."""
    sig = []
    for f in uploaded_files:
        if isinstance(f, tuple):
            sig.append((f[0], len(f[1])))
        elif hasattr(f, "name") and hasattr(f, "size"):
            sig.append((f.name, f.size))
        elif hasattr(f, "filename") and hasattr(f, "size"):
            sig.append((f.filename, f.size or 0))
        elif isinstance(f, dict):
            sig.append((f.get("name", "unknown"), f.get("size", 0)))
        else:
            sig.append((str(f), 0))
    return tuple(sig)


def load_pdf_from_bytes(file_bytes: bytes, filename: str) -> List[Document]:
    """
    Parses PDF bytes using a temporary file and attaches filename metadata to all pages.
    """
    temp_filename = f"temp_{uuid.uuid4().hex[:8]}_{filename}"
    temp_path = ROOT_DIR / temp_filename

    try:
        with open(temp_path, "wb") as f:
            f.write(file_bytes)

        loader = PyPDFLoader(str(temp_path))
        documents = loader.load()

        for doc in documents:
            doc.metadata["source_file"] = filename

        return documents

    except Exception as e:
        logger.error(f"Error reading PDF {filename}: {e}")
        return []

    finally:
        try:
            if temp_path.exists():
                temp_path.unlink()
        except Exception:
            pass


def load_pdf_documents(uploaded_files) -> List[Document]:
    """
    Saves uploaded PDF files to temporary storage, parses them using PyPDFLoader,
    attaches source filename metadata to each document, and cleans up temporary files.
    Supports Streamlit UploadedFile, FastAPI UploadFile, or (filename, bytes) tuples.
    """
    all_documents = []

    for uploaded_file in uploaded_files:
        # Determine filename and content bytes
        if isinstance(uploaded_file, tuple):
            filename, content_bytes = uploaded_file
        elif hasattr(uploaded_file, "getbuffer"):
            # Streamlit UploadedFile
            filename = uploaded_file.name
            content_bytes = uploaded_file.getbuffer().tobytes()
        elif hasattr(uploaded_file, "read"):
            # File-like or FastAPI UploadFile
            filename = getattr(uploaded_file, "filename", getattr(uploaded_file, "name", "uploaded.pdf"))
            content_bytes = uploaded_file.read()
            if hasattr(content_bytes, "__await__"):
                # If called asynchronously, caller should pass bytes, but handle sync bytes here
                pass
        elif isinstance(uploaded_file, (str, Path)):
            path = Path(uploaded_file)
            filename = path.name
            with open(path, "rb") as f:
                content_bytes = f.read()
        else:
            continue

        docs = load_pdf_from_bytes(content_bytes, filename)
        all_documents.extend(docs)

    return all_documents
