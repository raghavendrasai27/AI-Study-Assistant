import streamlit as st
from src.config import validate_config
from src.models import get_embeddings
from src.document_loader import compute_file_signature, load_pdf_documents
from src.text_splitter import split_documents
from src.vectorstore import build_vectorstore
from src.ui.styles import setup_page, apply_custom_css, render_header, render_footer
from src.ui.components import (
    init_session_state,
    render_sidebar,
    render_document_metrics,
    render_no_document_notice,
    render_export_section
)
from src.ui.views import (
    render_qa_view,
    render_summary_view,
    render_questions_view,
    render_quiz_view,
    render_flashcards_view
)


def main():
    # 1. Page Configuration & Custom CSS
    setup_page()
    apply_custom_css()

    # 2. Environment Validation
    validate_config()

    # 3. Session State Initialization
    init_session_state()

    # 4. Header & Branding
    render_header()

    # 5. Sidebar Controls
    study_mode, uploaded_files, retrieval_k = render_sidebar()

    # 6. Document Ingestion Pipeline
    if uploaded_files:
        current_signature = compute_file_signature(uploaded_files)

        if st.session_state.file_signature != current_signature:
            st.session_state.vectorstore = None
            st.session_state.documents = []
            st.session_state.chunks = []
            st.session_state.messages = []
            st.session_state.generated_notes = []
            st.session_state.file_signature = current_signature
            st.session_state.file_names = [file.name for file in uploaded_files]

            with st.spinner("📖 Reading your PDF files..."):
                documents = load_pdf_documents(uploaded_files)
                st.session_state.documents = documents

            with st.spinner("✂️ Splitting documents into chunks..."):
                chunks = split_documents(documents)
                st.session_state.chunks = chunks

            with st.spinner("🔄 Creating local embeddings..."):
                try:
                    embeddings = get_embeddings()
                except Exception as e:
                    st.error(f"❌ Could not load embedding model:\n\n{e}")
                    st.stop()

            with st.spinner("🗂️ Building FAISS knowledge base..."):
                try:
                    vectorstore = build_vectorstore(chunks, embeddings)
                    st.session_state.vectorstore = vectorstore
                except Exception as e:
                    st.error(f"❌ Could not create FAISS database:\n\n{e}")
                    st.stop()

            st.success(f"✅ {len(uploaded_files)} PDF(s) processed successfully!")

    # 7. Document Status & Active Mode View
    if st.session_state.vectorstore:
        render_document_metrics(
            st.session_state.file_names,
            st.session_state.documents,
            st.session_state.chunks
        )

        if "Chat" in study_mode or "Ask" in study_mode:
            render_qa_view(st.session_state.vectorstore, retrieval_k)
        elif "Summary" in study_mode or "Summarize" in study_mode:
            render_summary_view(st.session_state.chunks)
        elif "Questions" in study_mode:
            render_questions_view(st.session_state.chunks)
        elif "Quiz" in study_mode:
            render_quiz_view(st.session_state.chunks)
        elif "Flashcard" in study_mode:
            render_flashcards_view(st.session_state.chunks)
    else:
        render_no_document_notice()

    # 8. Export All Notes & Footer
    render_export_section(st.session_state.generated_notes)
    render_footer()


if __name__ == "__main__":
    main()
