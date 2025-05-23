from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from flask import request, current_app
from app.models import User, projects, assignments, ChatMessage
from app import db, socketio  # Import socketio from app package
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@socketio.on("connect")
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")
    try:
        # Get the token from query params
        token = request.args.get("token", "")

        if not token:
            logger.warning("No token provided in connection")
            return False  # Reject connection

        # Verify and decode token
        decoded_token = decode_token(token)
        user_id = decoded_token["sub"]

        # Store user_id in session
        # Flask-SocketIO doesn't support adding attributes to request directly
        # in newer versions, so we use the session dict instead
        from flask import session

        session["user_id"] = user_id
        logger.info(f"User {user_id} connected with session {request.sid}")
        return True
    except Exception as e:
        logger.error(f"Socket connection error: {str(e)}")
        return False


@socketio.on("disconnect")
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")


@socketio.on("join")
def handle_join(data):
    """Handle room joining"""
    try:
        project_id = data.get("project_id")
        if not project_id:
            emit("error", {"message": "Project ID is required"})
            return

        # Get current user
        from flask import session

        user_id = session.get("user_id")
        if not user_id:
            emit("error", {"message": "Authentication required"})
            return

        # Get user details
        user = User.query.filter_by(employee_id=user_id).first()
        if not user:
            emit("error", {"message": "User not found"})
            return

        # Check if project exists
        project = projects.query.get(project_id)
        if not project:
            emit("error", {"message": "Project not found"})
            return

        # Check if user has access to project
        has_access = False
        if user.role in ["admin", "manager"]:
            has_access = True
        else:
            # For testers, check if they're assigned to the project
            assignment = assignments.query.filter_by(
                employee_id=user.employee_id, project_id=project_id
            ).first()

            if assignment or project.manager == user.employee_id:
                has_access = True

        if not has_access:
            emit("error", {"message": "You don't have access to this project"})
            return

        # Join the room
        room = f"project_{project_id}"
        join_room(room)
        logger.info(f"User {user_id} joined room {room}")

        # Notify room about join
        emit(
            "status",
            {
                "user": user.name,
                "message": "has joined the chat",
                "timestamp": datetime.utcnow().isoformat(),
            },
            room=room,
        )
    except Exception as e:
        logger.error(f"Error joining room: {str(e)}")
        emit("error", {"message": f"Failed to join room: {str(e)}"})


@socketio.on("leave")
def handle_leave(data):
    """Handle room leaving"""
    try:
        project_id = data.get("project_id")
        if not project_id:
            emit("error", {"message": "Project ID is required"})
            return

        # Get current user
        from flask import session

        user_id = session.get("user_id")
        if not user_id:
            emit("error", {"message": "Authentication required"})
            return

        # Get user details
        user = User.query.filter_by(employee_id=user_id).first()
        if not user:
            emit("error", {"message": "User not found"})
            return

        # Leave the room
        room = f"project_{project_id}"
        leave_room(room)
        logger.info(f"User {user_id} left room {room}")

        # Notify room about leave
        emit(
            "status",
            {
                "user": user.name,
                "message": "has left the chat",
                "timestamp": datetime.utcnow().isoformat(),
            },
            room=room,
        )
    except Exception as e:
        logger.error(f"Error leaving room: {str(e)}")
        emit("error", {"message": f"Failed to leave room: {str(e)}"})


@socketio.on("message")
def handle_message(data):
    """Handle new chat message"""
    try:
        # Validate input
        project_id = data.get("project_id")
        content = data.get("content")

        if not project_id or not content:
            emit("error", {"message": "Project ID and message content are required"})
            return

        # Get current user
        from flask import session

        user_id = session.get("user_id")
        if not user_id:
            emit("error", {"message": "Authentication required"})
            return

        # Get user details
        user = User.query.filter_by(employee_id=user_id).first()
        if not user:
            emit("error", {"message": "User not found"})
            return

        # Check if project exists
        project = projects.query.get(project_id)
        if not project:
            emit("error", {"message": "Project not found"})
            return

        # Check if user has access to project
        has_access = False
        if user.role in ["admin", "manager"]:
            has_access = True
        else:
            # For testers, check if they're assigned to the project
            assignment = assignments.query.filter_by(
                employee_id=user_id, project_id=project_id
            ).first()

            if assignment or project.manager == user_id:
                has_access = True

        if not has_access:
            emit("error", {"message": "You don't have access to this project"})
            return

        # Save message to database
        new_message = ChatMessage(
            project_id=project_id,
            employee_id=user_id,
            content=content,
            timestamp=datetime.utcnow(),
            is_file=False,
            file_path=None,
        )
        db.session.add(new_message)
        db.session.commit()

        # Format message for broadcast
        message_data = {
            "id": new_message.id,
            "content": new_message.content,
            "sender_id": new_message.employee_id,
            "sender_name": user.name,
            "timestamp": new_message.timestamp.isoformat(),
            "is_file": new_message.is_file,
            "file_path": new_message.file_path,
        }

        # Broadcast to room
        room = f"project_{project_id}"
        emit("message", message_data, room=room)

    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        emit("error", {"message": f"Failed to send message: {str(e)}"})
