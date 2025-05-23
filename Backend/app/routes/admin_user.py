from flask import Blueprint, request, jsonify
from app import db
from app.models import User, vms
from flasgger import swag_from
from app.utils.auth_utils import roles_required
from app.utils.vm_utils import create_vms

admin_user_bp = Blueprint("admin blueprint for user management", __name__)


@admin_user_bp.route("/get-all-users", methods=["GET"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "Get all users",
        "description": "Returns a list of all users in the system.",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of users",
                "schema": {
                    "type": "object",
                    "properties": {
                        "users": {"type": "array", "items": {"type": "object"}}
                    },
                },
            }
        },
    }
)
def get_all_users():
    users = User.query.all()
    user_list = [
        {
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
        }
        for user in users
    ]
    return jsonify({"users": user_list}), 200


@admin_user_bp.route("/create-user", methods=["POST"])
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "Create a new user",
        "description": "Allows admin to create a user with specified details.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "user",
                "schema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {"type": "string"},
                        "name": {"type": "string"},
                        "email": {"type": "string"},
                        "password": {"type": "string"},
                        "role": {"type": "string"},
                    },
                    "required": ["employee_id", "name", "email", "password"],
                },
            }
        ],
        "responses": {
            201: {"description": "User created successfully"},
            400: {"description": "User already exists"},
        },
    }
)
@roles_required("admin")
def create_user():
    data = request.get_json()
    employee_id = data.get("employee_id")
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "tester").lower()

    if (
        User.query.filter_by(employee_id=employee_id).first()
        or User.query.filter_by(email=email).first()
    ):
        return jsonify({"error": "User with this ID or email already exists"}), 400

    isinstance = create_vms(employee_id)
    vm1 = vms(
        employee_id=employee_id,
        instance_id=isinstance["linux"],
        instance_os="linux",
        guacamole_url=None,
    )
    vm2 = vms(
        employee_id=employee_id,
        instance_id=isinstance["windows"],
        instance_os="windows",
        guacamole_url=None,
    )

    db.session.add(vm1)
    db.session.add(vm2)
    db.session.commit()

    new_user = User(
        employee_id=employee_id,
        name=name,
        email=email,
        role=role,
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # user recives an email with the password and a link to change it
    # send_email(new_user.email, 'Welcome to the system', f'Your password is: {password}')
    return (
        jsonify(
            {
                "message": "User created successfully",
                "user": {
                    "employee_id": employee_id,
                    "name": name,
                    "email": email,
                    "role": role,
                },
            }
        ),
        201,
    )


@admin_user_bp.route("/update-role", methods=["PUT"])
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "Update user role",
        "description": "Allows admin to update a user's role.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "role_update",
                "schema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {"type": "string"},
                        "role": {"type": "string"},
                    },
                    "required": ["employee_id", "role"],
                },
            }
        ],
        "responses": {
            200: {"description": "Role updated successfully"},
            404: {"description": "User not found"},
        },
    }
)
@roles_required("admin")
def update_role():
    data = request.get_json()
    employee_id = data.get("employee_id")
    new_role = data.get("role").lower()

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        user.change_role(new_role)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    db.session.commit()

    return (
        jsonify(
            {
                "message": "User role updated successfully",
                "user": {"employee_id": user.employee_id, "new_role": user.role},
            }
        ),
        200,
    )


@admin_user_bp.route("/get-users", methods=["GET"])
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "List all users",
        "description": "Returns a list of all users in the system.",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of users",
                "schema": {
                    "type": "object",
                    "properties": {
                        "users": {"type": "array", "items": {"type": "object"}}
                    },
                },
            }
        },
    }
)
@roles_required("admin")
def get_users():
    users = User.query.all()
    user_list = [
        {
            "employee_id": user.employee_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
        }
        for user in users
    ]
    return jsonify({"users": user_list}), 200


@admin_user_bp.route("/soft-delete-user", methods=["PUT"])
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "Soft delete a user",
        "description": "Marks a user as inactive without deleting their record.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "delete_request",
                "schema": {
                    "type": "object",
                    "properties": {"employee_id": {"type": "string"}},
                    "required": ["employee_id"],
                },
            }
        ],
        "responses": {
            200: {"description": "User soft-deleted"},
            404: {"description": "User not found"},
        },
    }
)
@roles_required("admin")
def soft_delete_user():
    data = request.get_json()
    employee_id = data.get("employee_id")

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        user.change_status("inactive")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while soft deleting the user"}), 500

    db.session.commit()

    return (
        jsonify(
            {
                "message": "User has been soft deleted",
                "user": {"employee_id": user.employee_id, "new_status": user.status},
            }
        ),
        200,
    )


@admin_user_bp.route("/restore-user", methods=["PUT"])
@swag_from(
    {
        "tags": ["Admin Users"],
        "summary": "Restore a user",
        "operationId": "restoreUser",
        "description": "Restores a soft-deleted user back to active status.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "in": "body",
                "name": "restore_request",
                "schema": {
                    "type": "object",
                    "properties": {"employee_id": {"type": "string"}},
                    "required": ["employee_id"],
                },
            }
        ],
        "responses": {
            200: {"description": "User restored"},
            404: {"description": "User not found"},
        },
    }
)
@roles_required("admin")
def restore_user():
    data = request.get_json()
    employee_id = data.get("employee_id")

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        user.change_status("active")
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while restoring the user"}), 500

    db.session.commit()

    return (
        jsonify(
            {
                "message": "User has been restored",
                "user": {"employee_id": user.employee_id, "new_status": user.status},
            }
        ),
        200,
    )


@admin_user_bp.route("/change-password", methods=["PUT"])
@roles_required("admin")
def change_password():
    data = request.get_json()
    employee_id = data.get("employee_id")
    new_password = data.get("new_password")

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user.set_password(new_password)
    db.session.commit()
    return (
        jsonify(
            {
                "message": "User password updated successfully",
                "user": {"employee_id": user.employee_id, "new_role": user.role},
            }
        ),
        200,
    )


@admin_user_bp.route("/change-email", methods=["PUT"])
@roles_required("admin")
def change_email():
    data = request.get_json()
    employee_id = data.get("employee_id")
    new_email = data.get("new_email")

    user = User.query.filter_by(employee_id=employee_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        user.change_email(new_email)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "An error occurred while changing the email"}), 500

    db.session.commit()
    return (
        jsonify(
            {
                "message": "User email updated successfully",
                "user": {"employee_id": user.employee_id, "new_role": user.role},
            }
        ),
        200,
    )


@admin_user_bp.route("/update-user", methods=["PUT"])
@roles_required("admin")
def update_user():
    data = request.get_json()
    employee_id = data.get("employee_id")
    new_name = data.get("name")
    new_email = data.get("email")
    new_role = data.get("role").lower()
    password = data.get("password")

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if new_name:
        user.name = new_name
    if new_email:
        user.email = new_email
    if new_role:
        try:
            user.change_role(new_role)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
    if password:
        user.set_password(password)
    db.session.commit()
    return (
        jsonify(
            {
                "message": "User updated successfully",
                "user": {
                    "employee_id": user.employee_id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                },
            }
        ),
        200,
    )
