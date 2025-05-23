from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    jwt_required,
    get_jwt,
    unset_access_cookies,
)
from app import db
from app.models import User, PasswordReset
from app.utils.auth_utils import roles_required
import os
import uuid
from flasgger import swag_from
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
@swag_from(
    {
        "tags": ["Authentication"],
        "summary": "User Login",
        "description": "Authenticate a user and return a JWT access token.",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {
                            "type": "string",
                            "description": "The employee ID of the user.",
                        },
                        "password": {
                            "type": "string",
                            "description": "The password of the user.",
                        },
                    },
                    "required": ["employee_id", "password"],
                },
            }
        ],
        "responses": {
            200: {
                "description": "Login successful",
                "schema": {
                    "type": "object",
                    "properties": {
                        "access_token": {
                            "type": "string",
                            "description": "JWT access token.",
                        },
                        "role": {"type": "string", "description": "Role of the user."},
                    },
                },
            },
            401: {"description": "Invalid credentials"},
        },
    }
)
def login():
    data = request.get_json()
    employee_id = data.get("employee_id")
    password = data.get("password")
    user = User.query.filter_by(employee_id=employee_id, status="active").first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity=user.employee_id)
    set_access_cookies
    return jsonify({"access_token": access_token, "role": user.role}), 200


@auth_bp.route("/request-password-reset", methods=["POST"])
@swag_from(
    {
        "tags": ["Authentication"],
        "summary": "Request password reset",
        "description": "Generates a reset token and sends the reset link to the user.",
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {"employee_id": {"type": "string"}},
                    "required": ["employee_id"],
                },
            }
        ],
        "responses": {
            200: {
                "description": "Password reset link generated successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string"},
                        "reset_link": {"type": "string"},
                    },
                },
            },
            404: {"description": "User not found"},
        },
    }
)
def request_password_reset():
    data = request.get_json()
    employee_id = data.get("employee_id")
    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Generate a secure reset token
    reset_token = str(uuid.uuid4())

    # Delete any existing reset tokens for this user
    PasswordReset.query.filter_by(employee_id=employee_id).delete()

    # Create a new password reset request
    password_reset = PasswordReset(employee_id=employee_id, reset_token=reset_token)
    db.session.add(password_reset)
    db.session.commit()

    reset_link = f"{request.url_root}auth/reset-password/{reset_token}"

    # Send reset link to user's email (this is a placeholder, implement actual email sending)
    return (
        jsonify({"message": "Password reset email sent"}),
        200,
    )


@auth_bp.route("/reset-password/<token>", methods=["POST"])
@swag_from(
    {
        "tags": ["Authentication"],
        "summary": "Reset password using token",
        "description": "Validates the token and sets a new password for the user.",
        "parameters": [
            {
                "name": "token",
                "in": "path",
                "type": "string",
                "required": True,
                "description": "Password reset token",
            },
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {"new_password": {"type": "string"}},
                    "required": ["new_password"],
                },
            },
        ],
        "responses": {
            200: {
                "description": "Password reset successfully",
                "schema": {
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                },
            },
            400: {"description": "Invalid or expired token"},
            404: {"description": "User not found"},
        },
    }
)
def reset_password(token):
    password_reset = PasswordReset.query.filter_by(reset_token=token).first()

    if not password_reset or password_reset.is_expired():
        return jsonify({"error": "Invalid or expired token"}), 400

    user = User.query.filter_by(employee_id=password_reset.employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    new_password = data.get("new_password")

    user.set_password(new_password)

    # Remove the used reset token from the database
    db.session.delete(password_reset)
    db.session.commit()

    return jsonify({"message": "Password reset successfully"}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
@swag_from(
    {
        "tags": ["Authentication"],
        "summary": "User Logout",
        "description": "Logs out the user and invalidates the JWT.",
        "responses": {
            200: {
                "description": "Logout successful",
                "schema": {
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                },
            }
        },
        "security": [{"BearerAuth": []}],
    }
)
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_access_cookies(response)
    return response, 200
