import os
from flask import Flask
from flasgger import Swagger
from dotenv import load_dotenv
from app import db, migrate, jwt, socketio
from werkzeug.middleware.proxy_fix import ProxyFix
import openai
from flask_cors import CORS

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app, origins="*")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_prefix=1)
    # DB Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", "sqlite:///collabsec.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["UPLOADS_DIR"] = os.getenv("UPLOADS_DIR", "uploads")
    # Guacamole Configuration
    app.config["GUACAMOLE_URL"] = os.getenv("GUACAMOLE_URL", "http://localhost:8080")
    app.config["GUACAMOLE_SECRET_HEX_KEY"] = os.getenv(
        "GUACAMOLE_SECRET_HEX_KEY", "91ef08840af07d00919a7b90ebde4107"
    )
    # AWS EC2 Configuration
    app.config["DEFAULT_REGION"] = os.getenv("DEFAULT_REGION", "me-south-1")
    app.config["VPC_ID"] = os.getenv("VPC_ID", "vpc-06f066366f69a440c")
    app.config["PRIVATE_SUBNET_ID"] = os.getenv(
        "PRIVATE_SUBNET_ID", "subnet-054e5a39df050141b"
    )
    app.config["SECURITY_GROUP_ID"] = os.getenv(
        "SECURITY_GROUP_ID", "sg-0ba75647f27d5a52f"
    )
    app.config["INSTANCE_TYPE"] = os.getenv("INSTANCE_TYPE", "t3.large")
    app.config["LINUX_IMAGE_ID"] = os.getenv("LINUX_IMAGE_ID", "ami-021bf1512473ff5ba")
    app.config["WINDOWS_IMAGE_ID"] = os.getenv(
        "WINDOWS_IMAGE_ID", "ami-021bf1512473ff5ba"
    )
    # JWT Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "CollabSecJWTSecret")
    app.config["JWT_COOKIE_DOMAIN"] = os.getenv("JWT_COOKIE_DOMAIN", None)
    app.config["JWT_COOKIE_PATH"] = os.getenv("JWT_COOKIE_PATH", "/")
    app.config["JWT_COOKIE_SECURE"] = os.getenv("JWT_COOKIE_SECURE", True)


    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    Swagger(
        app,
        config={
            "headers": [],
            "specs": [
                {
                    "endpoint": "apispec",
                    "route": "/apispec.json",
                    "rule_filter": lambda rule: True,  # include all endpoints
                    "model_filter": lambda tag: True,  # include all models
                }
            ],
            "static_url_path": "/flasgger_static",
            "swagger_ui": True,
            "specs_route": "/apidocs/",
            "securityDefinitions": {
                "BearerAuth": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "Enter JWT token like: **Bearer &lt;your_token&gt;**",
                }
            },
            "security": [{"BearerAuth": []}],
        },
    )

    uploads_dir = os.path.join(app.config["UPLOADS_DIR"])
    os.makedirs(uploads_dir, exist_ok=True)
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin_user import admin_user_bp
    from app.routes.user import user_bp
    from app.routes.vm import vm_bp
    from app.routes.admin_vm import admin_vm_bp
    from app.routes.ai_chat import ai_chat_bp
    from app.routes.admin_project import admin_project_bp
    from app.routes.project import project_bp
    from app.routes.target import target_bp
    from app.routes.chat import chat_bp


    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(user_bp, url_prefix="/user")
    app.register_blueprint(vm_bp, url_prefix="/vm")
    app.register_blueprint(ai_chat_bp, url_prefix="/ai-chat")
    app.register_blueprint(project_bp, url_prefix="/project")
    app.register_blueprint(target_bp, url_prefix="/target")
    app.register_blueprint(chat_bp, url_prefix="/chat")


    # Admin routes
    app.register_blueprint(admin_user_bp, url_prefix="/admin/user")
    app.register_blueprint(admin_vm_bp, url_prefix="/admin/vm")
    app.register_blueprint(admin_project_bp, url_prefix="/admin/project")
    # Initialize SocketIO

    from app.socket import socketio

    socketio.init_app(app, cors_allowed_origins="*")  # In production, restrict origins
    return app


if __name__ == "__main__":
    app = create_app()
    # app.run(
    #     host=os.getenv("FLASK_HOST", "127.0.0.1"),
    #     port=os.getenv("FLASK_PORT", 5000),
    #     debug=os.getenv("FLASK_DEBUG", True),
    # )
    socketio.run(
        app,
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", True),
    )
