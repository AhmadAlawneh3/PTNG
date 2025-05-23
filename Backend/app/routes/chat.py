from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import emit, join_room, leave_room
from datetime import datetime
from app import db
from app.models import User, projects, assignments, ChatMessage
from app.utils.auth_utils import roles_required
from flasgger import swag_from
import os, uuid
from werkzeug.utils import secure_filename

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/messages/<int:project_id>", methods=["GET"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Chat"],
        "summary": "Get project chat messages",
        "description": "Retrieve chat messages for a specific project.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "ID of the project to get chat messages for.",
            },
            {
                "name": "limit",
                "in": "query",
                "type": "integer",
                "required": False,
                "description": "Maximum number of messages to retrieve (default: 50).",
            },
            {
                "name": "offset",
                "in": "query",
                "type": "integer",
                "required": False,
                "description": "Number of messages to skip (for pagination).",
            },
        ],
        "responses": {
            200: {
                "description": "List of chat messages.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "messages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "id": {"type": "integer"},
                                    "content": {"type": "string"},
                                    "sender_name": {"type": "string"},
                                    "timestamp": {
                                        "type": "string",
                                        "format": "date-time",
                                    },
                                    "is_file": {"type": "boolean"},
                                    "file_path": {"type": "string"},
                                },
                            },
                        }
                    },
                },
            },
            403: {"description": "User does not have access to this project."},
            404: {"description": "Project not found."},
        },
    }
)
def get_messages(project_id):
    # Get the current user
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    # Check if the project exists
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Check if the user has access to the project
    if user.role != "admin" and user.role != "manager":
        # For testers, check if they're assigned to the project
        assignment = assignments.query.filter_by(
            employee_id=user.employee_id, project_id=project_id
        ).first()

        if not assignment and project.manager != user.employee_id:
            return jsonify({"error": "User does not have access to this project"}), 403

    # Get pagination parameters
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)

    # Query the chat messages
    messages = (
        ChatMessage.query.filter_by(project_id=project_id)
        .order_by(ChatMessage.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Format the messages
    messages_data = [
        {
            "id": message.id,
            "content": message.content,
            "sender_id": message.employee_id,
            "sender_name": message.sender.name,
            "timestamp": message.timestamp.isoformat(),
            "is_file": message.is_file,
            "file_path": message.file_path if message.is_file else None,
        }
        for message in messages
    ]

    return jsonify({"messages": messages_data}), 200


@chat_bp.route("/messages/<int:project_id>", methods=["POST"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Chat"],
        "summary": "Send a text message",
        "description": "Send a text message to a project chat.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "ID of the project to send a message to.",
            },
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "content": {"type": "string", "description": "Message content."}
                    },
                    "required": ["content"],
                },
            },
        ],
        "responses": {
            201: {"description": "Message sent successfully."},
            403: {"description": "User does not have access to this project."},
            404: {"description": "Project not found."},
        },
    }
)
def send_message(project_id):
    # Get the current user
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    # Check if the project exists
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Check if the user has access to the project
    if user.role != "admin" and user.role != "manager":
        # For testers, check if they're assigned to the project
        assignment = assignments.query.filter_by(
            employee_id=user.employee_id, project_id=project_id
        ).first()

        if not assignment and project.manager != user.employee_id:
            return jsonify({"error": "User does not have access to this project"}), 403

    # Get the message content
    data = request.get_json()
    content = data.get("content")

    if not content or content.strip() == "":
        return jsonify({"error": "Message content is required"}), 400

    # Create and save the message
    new_message = ChatMessage(
        project_id=project_id,
        employee_id=user.employee_id,
        content=content,
        timestamp=datetime.utcnow(),
    )

    db.session.add(new_message)
    db.session.commit()

    return (
        jsonify({"message": "Message sent successfully", "message_id": new_message.id}),
        201,
    )


@chat_bp.route("/upload/<int:project_id>", methods=["POST"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Chat"],
        "summary": "Upload a file to chat",
        "description": "Upload a file to a project chat.",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "ID of the project to upload a file to.",
            },
            {
                "name": "file",
                "in": "formData",
                "type": "file",
                "required": True,
                "description": "File to upload.",
            },
        ],
        "responses": {
            201: {"description": "File uploaded successfully."},
            400: {"description": "No file uploaded or file too large."},
            403: {"description": "User does not have access to this project."},
            404: {"description": "Project not found."},
        },
    }
)
def upload_file(project_id):
    # Get the current user
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    # Check if the project exists
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Check if the user has access to the project
    if user.role != "admin" and user.role != "manager":
        # For testers, check if they're assigned to the project
        assignment = assignments.query.filter_by(
            employee_id=user.employee_id, project_id=project_id
        ).first()

        if not assignment and project.manager != user.employee_id:
            return jsonify({"error": "User does not have access to this project"}), 403

    # Check if file is in the request
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Check if filename is empty
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Check file size (limit to 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    if request.content_length > MAX_FILE_SIZE:
        return jsonify({"error": "File too large. Maximum size is 5MB"}), 400

    # Create chat_files directory if it doesn't exist
    uploads_dir = os.path.join(
        current_app.config.get("UPLOADS_DIR"), "chat_files", str(project_id)
    )
    os.makedirs(uploads_dir, exist_ok=True)

    # Save the file with a secure filename
    filename = secure_filename(f"{uuid.uuid4().hex}_{file.filename}")
    file_path = os.path.join(uploads_dir, filename)
    file.save(file_path)

    # Create a chat message with file reference
    new_message = ChatMessage(
        project_id=project_id,
        employee_id=user.employee_id,
        content=f"File: {file.filename}",
        timestamp=datetime.utcnow(),
        is_file=True,
        file_path=f"/uploads/chat_files/{project_id}/{filename}",
    )

    db.session.add(new_message)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "File uploaded successfully",
                "message_id": new_message.id,
                "file_path": new_message.file_path,
            }
        ),
        201,
    )

# return all avaulabpe chats rooms for the admin
@chat_bp.route("/rooms", methods=["GET"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Chat"],
        "summary": "Get all chat rooms",
        "description": "Retrieve all chat rooms.",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of chat rooms.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "rooms": {
                            "type": "array",
                            "items": {"type": "string"},
                        }
                    },
                },
            }
        },
    }
)
def get_rooms():
    # Get all chat rooms
    rooms = db.session.query(ChatMessage.project_id).distinct().all()
    room_list = [room[0] for room in rooms]

    return jsonify({"rooms": room_list}), 200

@chat_bp.route("/download/<int:project_id>/<filename>", methods=["GET"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Chat"],
        "summary": "Download a file from chat",
        "description": "Download a previously uploaded file from a project chat.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "ID of the project.",
            },
            {
                "name": "filename",
                "in": "path",
                "type": "string",
                "required": True,
                "description": "Name of the file to download.",
            },
        ],
        "responses": {
            200: {"description": "File downloaded successfully."},
            403: {"description": "User does not have access to this project."},
            404: {"description": "File or project not found."},
        },
    }
)
def download_file(project_id, filename):
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    project = projects.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if user.role != "admin" and user.role != "manager":
        assignment = assignments.query.filter_by(
            employee_id=user.employee_id, project_id=project_id
        ).first()
        if not assignment and project.manager != user.employee_id:
            return jsonify({"error": "User does not have access to this project"}), 403

    uploads_dir = os.path.join(
        current_app.config.get("UPLOADS_DIR"), "chat_files", str(project_id)
    )
    file_path = os.path.join(uploads_dir, filename)

    if not os.path.isfile(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(file_path, as_attachment=True)