from typing import List, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from src.config import CHUNK_SIZE, CHUNK_OVERLAP, CHUNK_SEPARATORS


def split_documents(
    documents: List[Document],
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    separators: Optional[List[str]] = None
) -> List[Document]:
    """Splits loaded documents into smaller text chunks for vector indexing."""
    if separators is None:
        separators = CHUNK_SEPARATORS

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=separators
    )

    return text_splitter.split_documents(documents)
