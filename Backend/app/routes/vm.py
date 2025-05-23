from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User
from flasgger import swag_from
from app.utils.auth_utils import roles_required
from app.utils.vm_utils import (
    start_vm_util,
    stop_vm_util,
    vm_status_util,
    restart_vm_util,
)

vm_bp = Blueprint("vm", __name__)


@vm_bp.route("/start-vm", methods=["POST"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["VM"],
        "description": "Start a VM for the current user.",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "instance_os",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": 'The operating system of the VM to start (e.g., "linux" or "windows").',
            },
        ],
        "responses": {
            200: {
                "description": "VM started successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Success message.",
                        },
                        "URL": {
                            "type": "string",
                            "description": "Guacamole URL for the VM.",
                        },
                    },
                },
            },
            400: {"description": "Bad request"},
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def start_vm():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    instance_os = request.form.get("instance_os", None).lower()
    if not instance_os:
        return jsonify({"error": "Instance os is required"}), 400

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    return start_vm_util(current_user_id, instance_os)


@vm_bp.route("/stop-vm", methods=["POST"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["VM"],
        "description": "Stop a VM",  # Fixed description
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "instance_os",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": 'The operating system of the VM to stop (e.g., "linux" or "windows").',
            },
        ],
        "responses": {
            200: {
                "description": "VM Stopped successfully",
                "schema": {
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                },
            },
            400: {"description": "Bad request"},
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def stop_vm():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    instance_os = request.form.get("instance_os", None).lower()
    if not instance_os:
        return jsonify({"error": "Instance os is required"}), 400

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    return stop_vm_util(current_user_id, instance_os)


@vm_bp.route("/restart-vm", methods=["POST"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["VM"],
        "description": "Restart a VM",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "instance_os",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": 'The operating system of the VM to restart (e.g., "linux" or "windows").',
            },
        ],
        "responses": {
            200: {
                "description": "VM restarted successfully",
                "schema": {
                    "type": "object",
                    "properties": {"message": {"type": "string"}},
                },
            },
            400: {"description": "Bad request"},
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def restart_vm():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    instance_os = request.form.get("instance_os", None).lower()
    if not instance_os:
        return jsonify({"error": "Instance os is required"}), 400

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    return restart_vm_util(current_user_id, instance_os)


@vm_bp.route("/get-status", methods=["POST"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["VM"],
        "description": "Get the status of all VMs for the current user.",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "responses": {
            200: {
                "description": "VM status retrieved successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "linux": {
                            "type": "string",
                            "description": "Status of the Linux VM.",
                        },
                        "windows": {
                            "type": "string",
                            "description": "Status of the Windows VM.",
                        },
                    },
                },
            },
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def get_status():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()

    if not user:
        return jsonify({"error": "User not found"}), 404
    return vm_status_util(current_user_id)


@vm_bp.route("/get-vms", methods=["GET"])
@roles_required("admin", "tester", "manager")
@swag_from(
    {
        "tags": ["VM"],
        "description": "Get all VMs for the current user.",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "VM information retrieved successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "vms": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "instance_id": {"type": "string"},
                                    "instance_os": {"type": "string"},
                                    "guacamole_url": {"type": "string"},
                                    "status": {"type": "string"},
                                },
                            },
                        }
                    },
                },
            },
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def get_vms():
    """Return all data about a user's VMs"""
    try:
        from app.models import vms as VMs

        current_user_id = get_jwt_identity()

        # First check if user exists
        user = User.query.filter_by(employee_id=current_user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Query VMs directly from the VMs model using the employee_id
        user_vms = VMs.query.filter_by(employee_id=current_user_id).all()

        if not user_vms:
            return jsonify({"error": "User doesn't have any VMs"}), 404

        # Format the result
        vm_list = []
        for vm in user_vms:
            vm_list.append(
                {
                    "instance_id": vm.instance_id,
                    "instance_os": vm.instance_os,
                    "guacamole_url": vm.guacamole_url,
                    "status": vm.status,
                }
            )

        return jsonify({"vms": vm_list}), 200

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
