from flask_bcrypt import Bcrypt
from flask import Blueprint
from datetime import datetime, timedelta
from app import db

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()


class User(db.Model):
    __tablename__ = "users"

    employee_id = db.Column(db.String(20), primary_key=True, unique=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="tester")
    status = db.Column(
        db.Enum("active", "inactive", name="user_status"),
        nullable=False,
        default="active",
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    profile_picture = db.Column(db.String(255), nullable=True)

    def set_password(self, password: str):
        """Hashes and sets the password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Checks if the provided password matches the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def change_role(self, new_role):
        """Changes the user's role."""
        if new_role not in ["admin", "tester", "manager"]:
            raise ValueError(
                "Invalid role. Choose from 'admin', 'tester', or 'manager'."
            )
        self.role = new_role

    def change_email(self, new_email):
        """Changes the user's email."""
        if User.query.filter_by(email=new_email).first():
            raise ValueError("Email already in use.")
        self.email = new_email

    def change_status(self, new_status):
        """Changes the user's status."""
        if new_status not in ["active", "inactive"]:
            raise ValueError("Invalid status. Choose from 'active' or 'inactive'.")
        self.status = new_status

    def __repr__(self):
        return f"<User {self.employee_id}>"


def init_extensions(app):
    bcrypt.init_app(app)
    db.init_app(app)


class PasswordReset(db.Model):
    __tablename__ = "password_resets"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    reset_token = db.Column(db.String(64), unique=True, nullable=False)
    expires_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.utcnow() + timedelta(minutes=15),
    )

    def is_expired(self):
        return datetime.utcnow() > self.expires_at


class vms(db.Model):
    __tablename__ = "vms"

    id = db.Column(db.Integer, primary_key=True)
    instance_id = db.Column(db.String(255), nullable=False)
    guacamole_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    employee_id = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    status = db.Column(
        db.Enum("running", "stopped", name="vm_status"),
        nullable=False,
        default="stopped",
    )
    instance_os = db.Column(db.Enum("linux", "windows", name="vm_type"), nullable=False)


class projects(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(30), nullable=False)
    description = db.Column(db.Text, nullable=False)
    scope = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.Enum("not started", "in progress", "complete", name="project_status"),
        nullable=False,
        default="not started",
    )
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)

    manager = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    updated_by = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    archived = db.Column(db.Boolean, default=False)


class assignments(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)


class targets(db.Model):
    __tablename__ = "targets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    status = db.Column(
        db.Enum("not tested", "in progress", "tested", name="target_status"),
        nullable=False,
        default="not tested",
    )
    tester = db.Column(db.String(20), db.ForeignKey("users.employee_id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    updated_by = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=True
    )


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    employee_id = db.Column(
        db.String(20), db.ForeignKey("users.employee_id"), nullable=False
    )
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_file = db.Column(db.Boolean, default=False)
    file_path = db.Column(db.String(255), nullable=True)

    # Relationships
    sender = db.relationship("User", backref="sent_messages")
    project = db.relationship("projects", backref="chat_messages")
