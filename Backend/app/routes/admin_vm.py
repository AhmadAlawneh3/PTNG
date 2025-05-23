from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from flasgger import swag_from
from app.utils.auth_utils import roles_required
from app.utils.vm_utils import create_vms
from app.utils.vm_utils import (
    start_vm_util,
    stop_vm_util,
    vm_status_util,
    restart_vm_util,
)

admin_vm_bp = Blueprint("Admin blueprint for vm management", __name__)


@admin_vm_bp.route("/start-vm", methods=["POST"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin VMs"],
        "description": "Start a VM for a user",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "employee_id",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": "The employee ID of the user to start the VM for.",
            },
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
                    "properties": {"message": {"type": "string"}},
                },
            },
            400: {"description": "Bad request"},
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def start_vm():
    """Start a VM for a user."""
    employee_id = request.form.get("employee_id")
    instance_os = request.form.get("instance_os").lower()

    if not employee_id or not instance_os:
        return jsonify({"error": "Employee ID and instance OS are required"}), 400

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    try:
        return start_vm_util(employee_id, instance_os)
    except Exception as e:
        return jsonify({"error": "Error starting VM"}), 500


@admin_vm_bp.route("/stop-vm", methods=["POST"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin VMs"],
        "description": "Stop a VM for a user",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "employee_id",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": "The employee ID of the user to stop the VM for.",
            },
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
                "description": "VM stopped successfully",
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
    """Stop a VM for a user."""
    employee_id = request.form.get("employee_id")
    instance_os = request.form.get("instance_os").lower()

    if not employee_id or not instance_os:
        return jsonify({"error": "Employee ID and instance OS are required"}), 400

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    try:
        return stop_vm_util(employee_id, instance_os)
    except Exception as e:
        return jsonify({"error": "Error stopping VM"}), 500


@admin_vm_bp.route("/restart-vm", methods=["POST"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin VMs"],
        "description": "Restart a VM for a user",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "employee_id",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": "The employee ID of the user to restart the VM for.",
            },
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
    """Restart a VM for a user."""
    employee_id = request.form.get("employee_id")
    instance_os = request.form.get("instance_os").lower()

    if not employee_id or not instance_os:
        return jsonify({"error": "Employee ID and instance OS are required"}), 400

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    if instance_os not in ["linux", "windows"]:
        return jsonify({"error": "Invalid instance os"}), 400

    try:
        return restart_vm_util(employee_id, instance_os)
    except Exception as e:
        return jsonify({"error": "Error starting VM"}), 500


@admin_vm_bp.route("/vm-status", methods=["POST"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin VMs"],
        "description": "Get the status of a VM for a user.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "employee_id",
                "in": "formData",
                "type": "string",
                "required": True,
                "description": "The employee ID of the user to get the VM status for.",
            },
        ],
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
            400: {"description": "Bad request"},
            404: {"description": "User not found"},
            500: {"description": "Internal server error"},
        },
    }
)
def vm_status():
    """Get the status of a VM for a user."""
    employee_id = request.form.get("employee_id")
    if not employee_id:
        return jsonify({"error": "Employee ID and instance OS are required"}), 400

    user = User.query.filter_by(employee_id=employee_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    try:
        status = vm_status_util(employee_id)
        return status
    except Exception as e:
        return jsonify({"error": f"Error retrieving VM status"}), 500


@admin_vm_bp.route("/get-all-vms", methods=["GET"])
@roles_required("admin")
@swag_from(
    {
        "tags": ["Admin VMs"],
        "description": "Get information about all VMs assigned to employees",
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
                                    "id": {"type": "integer"},
                                    "instance_id": {"type": "string"},
                                    "employee_id": {"type": "string"},
                                    "user_name": {"type": "string"},
                                    "user_email": {"type": "string"},
                                    "instance_os": {"type": "string"},
                                    "status": {"type": "string"},
                                    "guacamole_url": {"type": "string"},
                                    "created_at": {
                                        "type": "string",
                                        "format": "date-time",
                                    },
                                    "updated_at": {
                                        "type": "string",
                                        "format": "date-time",
                                    },
                                },
                            },
                        }
                    },
                },
            },
            500: {"description": "Internal server error"},
        },
    }
)
def get_all_vms():
    """Get information about all VMs assigned to users."""
    try:
        from app.models import vms, User
        import boto3
        from flask import current_app
        from sqlalchemy.orm import joinedload

        # Get all VMs from database with associated user info
        vm_entries = (
            db.session.query(vms, User.name, User.email)
            .join(User, vms.employee_id == User.employee_id)
            .all()
        )

        # Get EC2 client for checking actual status
        ec2 = boto3.client("ec2", region_name=current_app.config.get("DEFAULT_REGION"))

        # Collect all instance IDs for batch status check
        instance_ids = [vm.instance_id for vm, _, _ in vm_entries]

        # Get status for all instances in one API call
        instance_statuses = {}
        if instance_ids:
            try:
                response = ec2.describe_instance_status(
                    InstanceIds=instance_ids, IncludeAllInstances=True
                )

                # Create a dict for quick lookup
                for instance in response.get("InstanceStatuses", []):
                    instance_id = instance["InstanceId"]
                    status = instance["InstanceState"]["Name"]
                    instance_statuses[instance_id] = status
            except Exception as e:
                # Fall back to individual status checks if batch fails
                print(f"Error in batch status check: {str(e)}")
                pass

        # Build the response
        vm_list = []
        for vm, user_name, user_email in vm_entries:
            # Get status from our batch results or default to DB value
            status = instance_statuses.get(vm.instance_id, vm.status)

            vm_list.append(
                {
                    "id": vm.id,
                    "instance_id": vm.instance_id,
                    "employee_id": vm.employee_id,
                    "user_name": user_name,
                    "user_email": user_email,
                    "instance_os": vm.instance_os,
                    "status": status,
                    "guacamole_url": vm.guacamole_url,
                    "created_at": vm.created_at.isoformat() if vm.created_at else None,
                    "updated_at": vm.updated_at.isoformat() if vm.updated_at else None,
                }
            )

        return jsonify({"vms": vm_list}), 200

    except Exception as e:
        import traceback

        print(traceback.format_exc())
        return jsonify({"error": f"Error retrieving VM information: {str(e)}"}), 500
