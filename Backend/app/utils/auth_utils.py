from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User


def roles_required(*required_roles):
    """Decorator to enforce role-based access control (RBAC)."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.filter_by(employee_id=current_user_id).first()

            if not user or user.role.lower() not in required_roles:
                return jsonify({"error": "Unauthorized"}), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator
