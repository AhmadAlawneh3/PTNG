from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, projects, assignments
from flasgger import swag_from
from app.utils.auth_utils import roles_required
from app.utils.vm_utils import (
    start_vm_util,
    stop_vm_util,
    vm_status_util,
    restart_vm_util,
)
from datetime import datetime
from app import db

project_bp = Blueprint("project", __name__)


@project_bp.route("/create-project", methods=["POST"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["Project"],
        "description": "Create a new project.",
        "security": [{"BearerAuth": []}],
        "consumes": ["application/json"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "project_name": {
                            "type": "string",
                            "description": "The name of the project.",
                        },
                        "description": {
                            "type": "string",
                            "description": "A description of the project.",
                        },
                        "scope": {
                            "type": "string",
                            "description": "The scope of the project.",
                        },
                        "start_date": {
                            "type": "string",
                            "format": "date",
                            "description": "The start date of the project in YYYY-MM-DD format.",
                        },
                        "end_date": {
                            "type": "string",
                            "format": "date",
                            "description": "The end date of the project in YYYY-MM-DD format.",
                        },
                    },
                    "required": [
                        "project_name",
                        "description",
                        "scope",
                        "start_date",
                        "end_date",
                    ],
                },
            }
        ],
        "responses": {
            201: {
                "description": "Project created successfully",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "Project created successfully",
                        }
                    },
                },
            },
            400: {
                "description": "Bad request",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "All fields are required",
                        }
                    },
                },
            },
            404: {
                "description": "User not found",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {"type": "string", "example": "User not found"}
                    },
                },
            },
        },
    }
)
def create_project():
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    # Get the form data
    project_name = data.get("project_name")
    description = data.get("description")
    scope = data.get("scope")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    # Validate the input data (you can add more validation as needed)
    if not project_name or not description or not start_date or not end_date:
        return jsonify({"message": "All fields are required"}), 400

    # validate date format (YYYY-MM-DD) and check if start_date is before end_date
    try:
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        if start_date >= end_date:
            return jsonify({"message": "Start date must be before end date"}), 400
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Create a new project entry in the database
    new_project = projects(
        name=project_name,
        description=description,
        scope=scope,
        start_date=start_date,
        end_date=end_date,
        manager=current_user_id,
        updated_by=current_user_id,
    )
    db.session.add(new_project)
    db.session.commit()

    return jsonify({"message": "Project created successfully"}), 201


@project_bp.route("/update-project/<int:project_id>", methods=["PUT"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["Project"],
        "description": "Update an existing project.",
        "security": [{"BearerAuth": []}],
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "The ID of the project to update.",
            },
            {
                "name": "project_name",
                "in": "formData",
                "type": "string",
                "required": False,
                "description": "The new name of the project.",
            },
            {
                "name": "description",
                "in": "formData",
                "type": "string",
                "required": False,
                "description": "A new description of the project.",
            },
            {
                "name": "start_date",
                "in": "formData",
                "type": "string",
                "required": False,
                "description": "The new start date of the project in YYYY-MM-DD format.",
            },
            {
                "name": "end_date",
                "in": "formData",
                "type": "string",
                "required": False,
                "description": "The new end date of the project in YYYY-MM-DD format.",
            },
        ],
    }
)
def update_project(project_id):
    current_user_id = get_jwt_identity()
    user = User.query.filter_by(employee_id=current_user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    # Get the project to update
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404

    data = request.get_json()
    # Get the form data
    project_name = data.get("project_name")
    description = data.get("description")
    scope = data.get("scope")
    status = data.get("status").lower()
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    # Update the project fields if provided
    if project_name:
        project.name = project_name
    if description:
        project.description = description
    if status:
        if status not in ["not started", "in progress", "complete"]:
            return jsonify({"message": "Invalid status value"}), 400
        project.status = status
    if scope:
        project.scope = scope
    if start_date:
        try:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            project.start_date = start_date
        except ValueError:
            return jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400
    if end_date:
        try:
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            project.end_date = end_date
        except ValueError:
            return jsonify({"message": "Invalid date format. Use YYYY-MM-DD."}), 400

    project.updated_at = datetime.utcnow()
    project.updated_by = current_user_id

    db.session.commit()

    return jsonify({"message": "Project updated successfully"}), 200


@project_bp.route("<int:project_id>", methods=["GET"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Project"],
        "description": "Get project details by ID.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "The ID of the project to retrieve.",
            }
        ],
        "responses": {
            200: {
                "description": "Project details retrieved successfully.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "name": {"type": "string"},
                        "description": {"type": "string"},
                        "scope": {"type": "string"},
                        "members": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "employee_id": {"type": "integer"},
                                    "name": {"type": "string"},
                                },
                            },
                        },
                        "status": {"type": "string"},
                        "start_date": {"type": "string", "format": "date"},
                        "end_date": {
                            "type": ["string", "null"],
                            "format": ["date", None],
                        },
                        # Add other fields as needed
                    },
                },
            },
            404: {
                "description": "Project not found.",
            },
        },
    }
)
def get_project(project_id):
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404

    project_data = {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "scope": project.scope,
        "members": [
            {
                "employee_id": assignment.employee_id,
                "name": User.query.filter_by(employee_id=assignment.employee_id)
                .first()
                .name,
            }
            for assignment in assignments.query.filter_by(project_id=project.id).all()
        ],
        "status": project.status,
        "start_date": project.start_date.strftime("%Y-%m-%d"),
        "end_date": project.end_date.strftime("%Y-%m-%d") if project.end_date else None,
    }

    return jsonify(project_data), 200


@project_bp.route("/get-projects", methods=["GET"])
@roles_required("admin", "manager", "tester")
@swag_from(
    {
        "tags": ["Project"],
        "description": "Get all projects the user is a member of or manages.",
        "security": [{"BearerAuth": []}],
        "responses": {
            200: {
                "description": "List of projects retrieved successfully.",
                "schema": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "integer"},
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "scope": {"type": "string"},
                            "members": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "employee_id": {"type": "integer"},
                                        "name": {"type": "string"},
                                    },
                                },
                            },
                            "status": {"type": "string"},
                            "start_date": {"type": "string", "format": "date"},
                            "end_date": {
                                "type": ["string", "null"],
                                "format": ["date", None],
                            },
                        },
                    },
                },
            },
            404: {
                "description": "No projects found.",
            },
        },
    }
)
def get_projects():
    current_user_id = get_jwt_identity()
    # Projects where user is manager
    managed_projects = projects.query.filter_by(manager=current_user_id)
    # Projects where user is assigned
    assigned_project_ids = [
        a.project_id
        for a in assignments.query.filter_by(employee_id=current_user_id).all()
    ]
    assigned_projects = projects.query.filter(projects.id.in_(assigned_project_ids))
    # Union and remove duplicates
    all_projects = {p.id: p for p in managed_projects}
    for p in assigned_projects:
        all_projects[p.id] = p
    projects_list = list(all_projects.values())
    if projects_list:
        projects_data = [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "scope": project.scope,
                "members": [
                    {
                        "employee_id": assignment.employee_id,
                        "name": User.query.filter_by(employee_id=assignment.employee_id)
                        .first()
                        .name,
                    }
                    for assignment in assignments.query.filter_by(
                        project_id=project.id
                    ).all()
                ],
                "status": project.status,
                "start_date": project.start_date.strftime("%Y-%m-%d"),
                "end_date": (
                    project.end_date.strftime("%Y-%m-%d") if project.end_date else None
                ),
            }
            for project in projects_list
        ]
        return jsonify(projects_data), 200
    return jsonify({"message": "No projects found"}), 404


@project_bp.route("/assign-project", methods=["POST"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["Project"],
        "summary": "Assign a user to a project",
        "description": "Assign a user to a project.",
        "security": [{"BearerAuth": []}],
        "consumes": ["application/json"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "project_id": {
                            "type": "integer",
                            "description": "The ID of the project to assign.",
                        },
                        "employee_id": {
                            "type": "integer",
                            "description": "The ID of the employee to assign to the project.",
                        },
                    },
                    "required": ["project_id", "employee_id"],
                },
            }
        ],
        "responses": {
            201: {
                "description": "User assigned to project successfully.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "User assigned to project successfully",
                        }
                    },
                },
            },
            400: {
                "description": "Bad request.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "All fields are required",
                        }
                    },
                },
            },
            404: {
                "description": "Not found.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "User not found",
                        }
                    },
                },
            },
        },
    }
)
def assign_project():
    data = request.get_json()
    project_id = data.get("project_id")
    employee_id = data.get("employee_id")

    # Validate the input data
    if not project_id or not employee_id:
        return jsonify({"message": "All fields are required"}), 400

    # Check if the project exists
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404

    # Check if the user exists
    user_to_assign = User.query.filter_by(employee_id=employee_id).first()
    if not user_to_assign:
        return jsonify({"message": "User not found"}), 404

    # Check if the user is already assigned to the project
    existing_assignment = assignments.query.filter_by(
        project_id=project_id, employee_id=employee_id
    ).first()
    if existing_assignment:
        return jsonify({"message": "User is already assigned to this project"}), 400

    # Create a new assignment entry in the database
    new_assignment = assignments(
        employee_id=employee_id, project_id=project_id, assigned_at=datetime.utcnow()
    )
    db.session.add(new_assignment)
    db.session.commit()

    return jsonify({"message": "User assigned to project successfully"}), 201


@project_bp.route("/remove-assignment", methods=["POST"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["Project"],
        "summary": "Remove a user from a project",
        "description": "Remove a user from a project.",
        "security": [{"BearerAuth": []}],
        "consumes": ["application/json"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "project_id": {
                            "type": "integer",
                            "description": "The ID of the project to remove the user from.",
                        },
                        "employee_id": {
                            "type": "integer",
                            "description": "The ID of the employee to remove from the project.",
                        },
                    },
                    "required": ["project_id", "employee_id"],
                },
            }
        ],
        "responses": {
            200: {
                "description": "User removed from project successfully.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "Assignment removed successfully",
                        }
                    },
                },
            },
            400: {
                "description": "Bad request.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "All fields are required",
                        }
                    },
                },
            },
            404: {
                "description": "Not found.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": ["string", None],
                            # Example: {"message":"Assignment not found"}
                        }
                    },
                },
            },
        },
    }
)
def remove_assignment():
    data = request.get_json()
    project_id = data.get("project_id")
    employee_id = data.get("employee_id")

    # Validate the input data
    if not project_id or not employee_id:
        return jsonify({"message": "All fields are required"}), 400

    # Check if the assignment exists
    assignment = assignments.query.filter_by(
        project_id=project_id, employee_id=employee_id
    ).first()
    if not assignment:
        return jsonify({"message": "Assignment not found"}), 404

    # Remove the assignment from the database
    db.session.delete(assignment)
    db.session.commit()

    return jsonify({"message": "Assignment removed successfully"}), 200


@project_bp.route("/archive-project/<int:project_id>", methods=["POST"])
@roles_required("admin", "manager")
@swag_from(
    {
        "tags": ["Project"],
        "summary": "Archive a project",
        "description": "Archive a project.",
        "security": [{"BearerAuth": []}],
        "parameters": [
            {
                "name": "project_id",
                "in": "path",
                "type": "integer",
                "required": True,
                "description": "The ID of the project to archive.",
            }
        ],
        "responses": {
            200: {
                "description": "Project archived successfully.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "example": "Project archived successfully",
                        }
                    },
                },
            },
            404: {
                "description": "Project not found.",
                "schema": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": ["string", None],
                            # Example: {"message":"Project not found"}
                        }
                    },
                },
            },
        },
    }
)
def archive_project(project_id):
    # Get the project to archive
    project = projects.query.get(project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404

    # Archive the project (you can implement your own archiving logic here)
    project.archived = True
    db.session.commit()

    return jsonify({"message": "Project archived successfully"}), 200
