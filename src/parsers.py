import re
from typing import List, Dict, Any, Tuple


def parse_flashcards_text(text: str) -> List[Dict[str, str]]:
    """Parses raw LLM flashcards markdown into structured card dictionaries with fallbacks."""
    cards = []
    
    # Try splitting by markdown headings or Card markers
    blocks = re.split(r'(?:###?\s*Card\s*\d+|(?:\*{0,2}Card\s*\d+\*{0,2}:?)|(?:\bCard\s*\d+:?))', text, flags=re.IGNORECASE)
    
    for idx, block in enumerate(blocks):
        block = block.strip()
        if not block:
            continue
            
        # Match Question
        q_match = re.search(r'\*{0,2}Question\*{0,2}:?\s*(.+?)(?=\n\s*\*{0,2}Answer\*{0,2}:?|\n\n|$)', block, re.DOTALL | re.IGNORECASE)
        
        # Match Answer
        a_match = re.search(r'\*{0,2}Answer\*{0,2}:?\s*(.+?)(?=\n\s*\*{0,2}(?:Key\s*)?Takeaway\*{0,2}:?|\n\n|$)', block, re.DOTALL | re.IGNORECASE)
        
        # Match Topic
        t_match = re.search(r'\*{0,2}Topic\*{0,2}:?\s*(.+?)(?=\n\s*\*{0,2}Question\*{0,2}:?|\n|$)', block, re.DOTALL | re.IGNORECASE)
        
        # Match Takeaway
        k_match = re.search(r'\*{0,2}(?:Key\s*)?Takeaway\*{0,2}:?\s*(.+?)(?=$|\n\n)', block, re.DOTALL | re.IGNORECASE)

        if q_match and a_match:
            cards.append({
                "id": len(cards) + 1,
                "topic": t_match.group(1).strip() if t_match else "Key Concept",
                "question": q_match.group(1).strip(),
                "answer": a_match.group(1).strip(),
                "takeaway": k_match.group(1).strip() if k_match else ""
            })

    # Fallback: if blocks didn't yield cards, look for any Q: / A: lines
    if not cards:
        lines = text.split("\n")
        curr_q, curr_a, curr_t = None, None, "Core Idea"
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if re.match(r'^(?:\*{0,2}Q(?:uestion)?\*{0,2}:?|\d+[\.\)])\s*(.+)', line, re.IGNORECASE):
                if curr_q and curr_a:
                    cards.append({
                        "id": len(cards) + 1,
                        "topic": curr_t,
                        "question": curr_q,
                        "answer": curr_a,
                        "takeaway": ""
                    })
                    curr_q, curr_a = None, None
                m = re.match(r'^(?:\*{0,2}Q(?:uestion)?\*{0,2}:?|\d+[\.\)])\s*(.+)', line, re.IGNORECASE)
                curr_q = m.group(1).strip()
            elif re.match(r'^(?:\*{0,2}A(?:nswer)?\*{0,2}:?)\s*(.+)', line, re.IGNORECASE):
                m = re.match(r'^(?:\*{0,2}A(?:nswer)?\*{0,2}:?)\s*(.+)', line, re.IGNORECASE)
                curr_a = m.group(1).strip()

        if curr_q and curr_a:
            cards.append({
                "id": len(cards) + 1,
                "topic": curr_t,
                "question": curr_q,
                "answer": curr_a,
                "takeaway": ""
            })

    return cards


def parse_quiz_text(text: str) -> List[Dict[str, Any]]:
    """Parses raw LLM quiz markdown into structured question dictionaries with fallbacks."""
    questions = []
    blocks = re.split(r'(?:###?\s*Question\s*\d+|(?:\*{0,2}Question\s*\d+\*{0,2}:?))', text, flags=re.IGNORECASE)
    
    for idx, block in enumerate(blocks):
        block = block.strip()
        if not block:
            continue

        c_match = re.search(r'Correct(?:\s*Answer)?:\s*([A-D])', block, re.IGNORECASE)
        e_match = re.search(r'Explanation:\s*(.+)', block, re.DOTALL | re.IGNORECASE)

        lines = block.split('\n')
        opts = {}
        for line in lines:
            m = re.match(r'^\s*[\*\-]?\s*([A-D])[\)\.\:]\s*(.+)', line.strip())
            if m:
                opts[m.group(1).upper()] = m.group(2).strip()

        q_lines = []
        for line in lines:
            line_str = line.strip()
            if re.match(r'^\s*[\*\-]?\s*[A-D][\)\.\:]', line_str) or 'Correct:' in line_str or 'Explanation:' in line_str:
                break
            if line_str:
                q_lines.append(line_str)
        q_text = " ".join(q_lines)

        if c_match and len(opts) >= 2:
            questions.append({
                "id": len(questions) + 1,
                "question": q_text,
                "options": opts,
                "correct": c_match.group(1).upper(),
                "explanation": e_match.group(1).strip() if e_match else "Based on your study notes."
            })
            
    return questions


def extract_follow_ups(text: str) -> Tuple[str, List[str]]:
    """
    Separates the main answer text from the Suggested Next Steps bullet points.
    Returns (cleaned_text, list_of_follow_ups).
    """
    pattern = r'(?:---\s*)?\*\*Suggested Next Steps:\*\*\s*(.+)$'
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    
    if not match:
        return text.strip(), []
    
    main_text = text[:match.start()].strip()
    follow_ups_block = match.group(1).strip()
    
    follow_ups = []
    for line in follow_ups_block.split('\n'):
        line = line.strip()
        clean_line = re.sub(r'^[\*\-\d\.\s]+', '', line).strip()
        if clean_line:
            clean_line = re.sub(r'^\[|\]$', '', clean_line).strip()
            if clean_line:
                follow_ups.append(clean_line)
                
    return main_text, follow_ups[:3]
