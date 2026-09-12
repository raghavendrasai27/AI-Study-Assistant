from pathlib import Path
from typing import List, Tuple
import streamlit as st
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from src.config import ROOT_DIR


def compute_file_signature(uploaded_files) -> Tuple[Tuple[str, int], ...]:
    """Generates a unique signature for the set of uploaded files based on name and size."""
    return tuple((file.name, file.size) for file in uploaded_files)


def load_pdf_documents(uploaded_files) -> List[Document]:
    """
    Saves uploaded PDF files to temporary storage, parses them using PyPDFLoader,
    attaches source filename metadata to each document, and cleans up temporary files.
    """
    all_documents = []

    for uploaded_file in uploaded_files:
        temp_path = ROOT_DIR / f"temp_{uploaded_file.name}"

        try:
            with open(temp_path, "wb") as f:
                f.write(uploaded_file.getbuffer())

            loader = PyPDFLoader(str(temp_path))
            documents = loader.load()

            # Attach filename metadata to every page document
            for doc in documents:
                doc.metadata["source_file"] = uploaded_file.name

            all_documents.extend(documents)

        except Exception as e:
            st.error(f"❌ Error reading {uploaded_file.name}:\n\n{e}")

        finally:
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except Exception:
                pass

    return all_documents
