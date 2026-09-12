import streamlit as st


def setup_page():
    """Configures the primary Streamlit page layout and title."""
    st.set_page_config(
        page_title="Alex · AI Study Companion",
        page_icon="🎓",
        layout="wide",
        initial_sidebar_state="expanded"
    )


def apply_custom_css():
    """Injects modern, human-centered CSS styling."""
    st.markdown(
        """
        <style>
        /* Global typography & spacing */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        html, body, [class*="css"] {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Hero Banner */
        .hero-banner {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
            border: 1px solid rgba(99, 102, 241, 0.18);
            border-radius: 16px;
            padding: 24px 28px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .hero-title {
            font-size: 28px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0 0 6px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .hero-subtitle {
            font-size: 15px;
            color: #4b5563;
            margin: 0;
            line-height: 1.5;
        }

        /* Metrics Card Container */
        .metrics-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 18px 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            margin-bottom: 20px;
        }

        .metric-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            background: #f3f4f6;
            color: #374151;
        }

        /* Source Badge Chips */
        .source-badge {
            display: inline-block;
            background: #f0fdf4;
            color: #15803d;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 3px 10px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 6px;
            margin-top: 4px;
        }

        /* Interactive Flashcard UI */
        .flashcard-wrapper {
            perspective: 1000px;
            margin: 20px auto;
            max-width: 680px;
        }

        .flashcard-box {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 2px solid #e0e7ff;
            border-radius: 20px;
            padding: 36px 32px;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.08);
            text-align: center;
            min-height: 240px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        .flashcard-badge {
            position: absolute;
            top: 16px;
            left: 20px;
            background: #ede9fe;
            color: #6d28d9;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .flashcard-question {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 24px 0 16px 0;
            line-height: 1.4;
        }

        .flashcard-answer-box {
            background: #f0fdf4;
            border: 1.5px dashed #86efac;
            border-radius: 14px;
            padding: 18px 22px;
            margin-top: 14px;
            width: 100%;
            text-align: left;
        }

        .flashcard-answer-text {
            font-size: 16px;
            color: #166534;
            line-height: 1.5;
            font-weight: 500;
        }

        .flashcard-takeaway {
            font-size: 13px;
            color: #4b5563;
            margin-top: 8px;
            font-style: italic;
        }

        /* Quiz UI Cards */
        .quiz-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 22px 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
        }

        .quiz-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
        }

        .quiz-q-title {
            font-size: 17px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 14px;
        }

        .quiz-explanation {
            background: #f8fafc;
            border-left: 4px solid #6366f1;
            padding: 12px 16px;
            border-radius: 0 10px 10px 0;
            margin-top: 14px;
            font-size: 14px;
            color: #334155;
        }

        /* Starter Prompts */
        .starter-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            margin-bottom: 8px;
        }

        .starter-card:hover {
            border-color: #818cf8;
            background: #f5f3ff;
            transform: translateY(-1px);
        }

        /* Dark mode compatibility fixes */
        @media (prefers-color-scheme: dark) {
            .hero-title { color: #e0e7ff; }
            .hero-subtitle { color: #9ca3af; }
            .hero-banner { background: rgba(99, 102, 241, 0.12); }
            .metrics-card { background: #18181b; border-color: #27272a; }
            .quiz-card { background: #18181b; border-color: #27272a; }
            .quiz-q-title { color: #f3f4f6; }
            .flashcard-box { background: #18181b; border-color: #312e81; }
            .flashcard-question { color: #f3f4f6; }
            .flashcard-answer-box { background: rgba(22, 101, 52, 0.2); border-color: #22c55e; }
            .flashcard-answer-text { color: #bbf7d0; }
        }
        </style>
        """,
        unsafe_allow_html=True
    )


def render_header():
    """Renders the top branding hero banner with friendly companion messaging."""
    st.markdown(
        """
        <div class="hero-banner">
            <div>
                <div class="hero-title">
                    🎓 Alex · Your AI Study Companion
                </div>
                <div class="hero-subtitle">
                    Drop your lecture slides, textbook chapters, or class notes to unlock interactive tutoring, flashcards, active recall quizzes, and revision summaries.
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_footer():
    """Renders the bottom application footer with friendly credit."""
    st.divider()
    st.markdown(
        """
        <div style="text-align: center; color: #9ca3af; font-size: 13px; margin: 16px 0 8px 0;">
            Made with ❤️ to help you study smarter · Powered by Gemini & LangChain
        </div>
        """,
        unsafe_allow_html=True
    )
