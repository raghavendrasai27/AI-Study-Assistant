import streamlit as st
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from src.config import GOOGLE_API_KEY, GEMINI_MODEL, EMBEDDING_MODEL


@st.cache_resource
def get_embeddings():
    """Initializes and caches the local HuggingFace embeddings model."""
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )


@st.cache_resource
def get_llm():
    """Initializes and caches the Gemini LLM client."""
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GOOGLE_API_KEY
    )


def extract_response_text(response) -> str:
    """Extracts raw text content from the Gemini LLM response object."""
    content = response.content

    # Normal string response
    if isinstance(content, str):
        return content.strip()

    # Structured Gemini response
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(item.get("text", ""))
        return "\n".join(text_parts).strip()

    # Fallback
    return str(content).strip()


def ask_gemini(prompt: str) -> str:
    """Safely invokes Gemini with a prompt and handles common API exceptions."""
    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        return extract_response_text(response)

    except Exception as e:
        error_message = str(e)

        if "429" in error_message:
            return (
                "⚠️ **Gemini API quota exceeded.**\n\n"
                "Please wait for the quota to reset and try again."
            )

        if "404" in error_message:
            return (
                "⚠️ **Gemini model not found.**\n\n"
                f"Configured model: `{GEMINI_MODEL}`.\n"
                "Please check your Gemini API access or configure `GEMINI_MODEL` in your `.env` file."
            )

        if "401" in error_message or "403" in error_message:
            return (
                "⚠️ **Gemini API authentication error.**\n\n"
                "Please check your `GOOGLE_API_KEY` in the `.env` file."
            )

        return (
            "❌ **Error while generating the answer:**\n\n"
            f"{error_message}"
        )
