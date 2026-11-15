"""
Generates a multi-page sample PDF: sample_course_notes.pdf
for testing and demonstration of the AI Study Assistant.
"""
from pathlib import Path

def create_course_pdf(output_path: str):
    pages = [
        # Page 1
        """Chapter 1: Foundations of Machine Learning and Supervised Learning
Supervised learning is a paradigm where an algorithm learns a mapping function from input features X to target labels y based on labeled training pairs.
Key concepts:
1. Linear Regression: Predicts a continuous scalar value. The hypothesis function is h_theta(x) = theta^T * x. It minimizes Mean Squared Error (MSE), which represents the average squared difference between estimated values and actual values.
2. Logistic Regression: Used for binary classification tasks. It applies the Sigmoid (logistic) function to linear outputs, mapping real numbers into probabilities between 0 and 1. The decision boundary is typically thresholded at 0.5.
3. Cost Function: Quantifies how wrong the model is. Binary Cross-Entropy (log loss) is preferred for classification because MSE creates non-convex surfaces when combined with sigmoid functions.""",

        # Page 2
        """Chapter 2: Neural Networks and Activation Functions
Deep learning utilizes multi-layer perceptrons (MLPs) consisting of an input layer, one or more hidden layers, and an output layer.
Key activation functions:
1. Sigmoid Function: 1 / (1 + e^-z). Suffers from vanishing gradients in deep networks because its derivative approaches zero for large positive or negative inputs.
2. ReLU (Rectified Linear Unit): f(x) = max(0, x). Avoids saturation for positive inputs and enables significantly faster convergence. However, it can suffer from the Dying ReLU problem where neurons become permanently inactive if inputs are consistently negative.
3. Leaky ReLU: f(x) = max(0.01x, x). Solves the Dying ReLU problem by maintaining a small non-zero slope for negative inputs.
4. Softmax: Used in multiclass classification at the output layer to convert logits into a normalized probability distribution that sums to 1.0.""",

        # Page 3
        """Chapter 3: Optimization and Backpropagation
Training a neural network involves finding the optimal weights that minimize the objective loss function.
1. Gradient Descent: An iterative optimization algorithm. In standard Batch Gradient Descent, weights are updated using all training examples. Stochastic Gradient Descent (SGD) updates weights using a single example at a time, resulting in faster but noisier updates. Mini-batch Gradient Descent balances both approaches.
2. Learning Rate (alpha): Hyperparameter determining step size toward the minimum. Too small causes slow convergence; too large causes oscillations or divergence.
3. Adam Optimizer: Combines AdaGrad and RMSProp with momentum, maintaining exponentially decaying averages of past gradients and squared gradients.
4. Backpropagation: Uses the chain rule of calculus to compute the partial derivative of the loss with respect to each parameter layer-by-layer backwards from output to input.""",

        # Page 4
        """Chapter 4: Generalization, Bias-Variance Tradeoff, and Overfitting
A machine learning model must perform well on unseen test data, not just memorize training samples.
1. Bias vs. Variance:
   - High Bias (Underfitting): Model is overly simplistic and cannot capture underlying data patterns. Training and test error are both high.
   - High Variance (Overfitting): Model fits noise in training data. Training error is very low, but test error is high.
2. Regularization Techniques:
   - L2 Regularization (Ridge / Weight Decay): Adds sum of squared weights to the loss function. Shrinks weights smoothly toward zero.
   - L1 Regularization (Lasso): Adds sum of absolute weights. Encourages sparsity by driving unimportant weights to exactly zero.
   - Dropout: Randomly deactivates a fraction p of neurons during each training forward pass, preventing co-adaptation.
   - Early Stopping: Halts training when validation loss stops improving to prevent over-optimization on training data."""
    ]

    # Build PDF with xref table
    objects = []
    
    # 1: Catalog
    # 2: Pages
    # 3..3+N-1: Page objects
    # 3+N..3+2N-1: Content streams
    # 3+2N: Font
    num_pages = len(pages)
    page_obj_ids = [3 + i for i in range(num_pages)]
    content_obj_ids = [3 + num_pages + i for i in range(num_pages)]
    font_obj_id = 3 + 2 * num_pages

    kids_str = " ".join(f"{pid} 0 R" for pid in page_obj_ids)
    
    pdf_parts = [
        b"%PDF-1.4\n",
        f"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".encode(),
        f"2 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj\n".encode(),
    ]

    for i in range(num_pages):
        pid = page_obj_ids[i]
        cid = content_obj_ids[i]
        page_dict = f"{pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {cid} 0 R /Resources << /Font << /F1 {font_obj_id} 0 R >> >> >>\nendobj\n".encode()
        pdf_parts.append(page_dict)

    for i, page_text in enumerate(pages):
        cid = content_obj_ids[i]
        # Format lines for PDF text output
        lines = page_text.split("\n")
        stream_cmds = ["BT", "/F1 12 Tf", "50 740 Td", "16 TL"]
        for line in lines:
            safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            stream_cmds.append(f"({safe_line}) '")
        stream_cmds.append("ET")
        stream_data = "\n".join(stream_cmds).encode("utf-8")
        stream_obj = f"{cid} 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode() + stream_data + b"\nendstream\nendobj\n"
        pdf_parts.append(stream_obj)

    pdf_parts.append(f"{font_obj_id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".encode())

    # Calculate offsets for xref
    offsets = [0]
    total_len = len(pdf_parts[0])
    for part in pdf_parts[1:]:
        offsets.append(total_len)
        total_len += len(part)

    xref_lines = [f"xref\n0 {len(offsets)}\n", "0000000000 65535 f \n"]
    for off in offsets[1:]:
        xref_lines.append(f"{off:010d} 00000 n \n")
    xref_data = "".join(xref_lines).encode()

    trailer = f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{total_len}\n%%EOF\n".encode()

    with open(output_path, "wb") as f:
        for part in pdf_parts:
            f.write(part)
        f.write(xref_data)
        f.write(trailer)

    print(f"Generated {output_path} with {num_pages} pages successfully.")

if __name__ == "__main__":
    create_course_pdf("sample_course_notes.pdf")
