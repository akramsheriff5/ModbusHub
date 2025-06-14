from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_migrate import Migrate
import os

# Initialize Flask extensions
db = SQLAlchemy()
login_manager = LoginManager()
socketio = SocketIO()
migrate = Migrate()

# Initialize Flask App
app = Flask(__name__)

# Configure the Flask application
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///plc_hub.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions with app
CORS(app, supports_credentials=True)  # Enable credentials
db.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
migrate.init_app(app, db) # Ensure migrate is initialized

# Import and Register blueprints with /api prefix
from app_hub.routes.plc import plc_bp
from app_hub.routes.registers import registers_bp
from app_hub.routes.plc_routes import mock_plc_bp
from app_hub.routes.auth import auth_bp

app.register_blueprint(mock_plc_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(plc_bp, url_prefix='/api')
app.register_blueprint(registers_bp, url_prefix='/api')

# Create database tables (This is for initial setup, migrations are preferred)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000) 