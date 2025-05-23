from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from flasgger import swag_from
from app.utils.auth_utils import roles_required
from app.utils.ai_utils import get_answer_from_ai

ai_chat_bp = Blueprint("AI Chat", __name__)


@ai_chat_bp.route("/ask", methods=["POST"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["AI Chat"],
        "description": "Ask a question to the AI model.",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "question",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": "The question to ask the AI model.",
            },
        ],
        "responses": {
            200: {
                "description": "AI response",
                "schema": {
                    "type": "object",
                    "properties": {
                        "answer": {
                            "type": "string",
                            "description": "The answer from the AI model.",
                        },
                    },
                },
            },
            400: {"description": "Bad request"},
            500: {"description": "Internal server error"},
        },
    }
)
def ask_ai():    
    question = request.form.get("question", None)
    if not question:
        return jsonify({"error": "Question is required"}), 400

    # Call the AI model to get the answer
    answer = get_answer_from_ai(question)

    return jsonify({"answer": answer}), 200