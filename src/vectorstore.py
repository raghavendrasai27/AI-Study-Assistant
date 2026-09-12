from typing import List, Tuple
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document


def build_vectorstore(chunks: List[Document], embeddings) -> FAISS:
    """Builds a FAISS vector store index from document chunks and embeddings."""
    return FAISS.from_documents(chunks, embeddings)


def retrieve_relevant_docs(vectorstore: FAISS, query: str, k: int = 4) -> List[Document]:
    """
    Retrieves the most relevant documents using Maximum Marginal Relevance (MMR)
    to promote diversity, falling back to standard similarity search if MMR fails.
    """
    try:
        return vectorstore.max_marginal_relevance_search(
            query,
            k=k,
            fetch_k=12,
            lambda_mult=0.7
        )
    except Exception:
        return vectorstore.similarity_search(
            query,
            k=k
        )


def format_context_and_sources(relevant_documents: List[Document]) -> Tuple[str, List[str]]:
    """
    Formats retrieved documents into a context block with source labels,
    and returns a tuple of (context_text, sources_list).
    """
    context_parts = []
    sources = []

    for i, doc in enumerate(relevant_documents):
        page = doc.metadata.get("page")
        filename = doc.metadata.get("source_file", "Uploaded PDF")

        if isinstance(page, int):
            source_label = f"{filename} — Page {page + 1}"
        else:
            source_label = f"{filename}"

        context_parts.append(
            f"[Source {i + 1}: {source_label}]\n{doc.page_content}"
        )
        sources.append(f"📄 {source_label}")

    context = "\n\n".join(context_parts)
    return context, sources
