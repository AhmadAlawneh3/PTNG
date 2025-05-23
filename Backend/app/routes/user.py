from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User
import os
from app.utils.auth_utils import roles_required

import uuid
from flasgger import swag_from

user_bp = Blueprint("user", __name__)


@user_bp.route("/get-profile", methods=["GET"])
@jwt_required()
@swag_from(
    {
        "tags": ["User"],
        "description": "Get current user profile using JWT token",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "User profile returned successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {"type": "string"},
                        "name": {"type": "string"},
                        "email": {"type": "string"},
                        "role": {"type": "string"},
                        "status": {"type": "string"},
                        "profile_picture": {"type": "string"},
                    },
                },
            },
            404: {"description": "User not found"},
        },
    }
)
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return (
        jsonify(
            {
                "employee_id": user.employee_id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "profile_picture": user.profile_picture,
            }
        ),
        200,
    )


@user_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
@swag_from(
    {
        "tags": ["User"],
        "description": "Update current user profile (name, email, profile_picture)",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {"name": "profile_picture", "in": "formData", "type": "file"},
        ],
        "responses": {
            200: {"description": "Profile updated successfully"},
            404: {"description": "User not found"},
        },
    }
)
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.form
    if "profile_picture" in request.files:
        uploads_dir = os.path.join(
            current_app.config.get("UPLOADS_DIR"), "profile_pictures"
        )
        os.makedirs(uploads_dir, exist_ok=True)

        file = request.files["profile_picture"]
        if file.filename:
            filename = secure_filename(
                f"{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
            )

            filepath = os.path.join(
                current_app.config.get("UPLOADS_DIR"), "profile_pictures", filename
            )
            file.save(filepath)
            user.profile_picture = filepath
            db.session.commit()
        else:
            return jsonify({"error": "No file uploaded"}), 400

    return (
        jsonify(
            {
                "message": "Profile updated successfully",
                "user": {
                    "employee_id": user.employee_id,
                    "name": user.name,
                    "email": user.email,
                    "profile_picture": user.profile_picture,
                },
            }
        ),
        200,
    )


@user_bp.route("/get-all-testers", methods=["GET"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["User"],
        "description": "Get all testers",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of testers returned successfully",
                "schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "employee_id": {"type": "string"},
                            "name": {"type": "string"},
                            "email": {"type": "string"},
                        },
                    },
                },
            },
        },
    }
)
def get_all_testers():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    testers = User.query.filter_by(role="tester").all()

    if not testers:
        return jsonify({"message": "No testers found"}), 404

    tester_list = [
        {"employee_id": tester.employee_id, "name": tester.name, "email": tester.email}
        for tester in testers
    ]

    return jsonify(tester_list), 200


@user_bp.route("/get-all-managers", methods=["GET"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["User"],
        "description": "Get all managers",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of managers returned successfully",
                "schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "employee_id": {"type": "string"},
                            "name": {"type": "string"},
                            "email": {"type": "string"},
                        },
                    },
                },
            },
        },
    }
)
def get_all_managers():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    managers = User.query.filter_by(role="manager").all()

    if not managers:
        return jsonify({"message": "No managers found"}), 404

    manager_list = [
        {
            "employee_id": manager.employee_id,
            "name": manager.name,
            "email": manager.email,
        }
        for manager in managers
    ]

    return jsonify(manager_list), 200
