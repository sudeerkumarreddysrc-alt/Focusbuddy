from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
import secrets

app = Flask(__name__)

# Configure SQLite DB
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'focusbuddy.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = secrets.token_hex(16)

db = SQLAlchemy(app)

# --- AUTH CONFIG ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# --- MODELS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'completed': self.completed,
            'created_at': self.created_at.isoformat()
        }

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    progress = db.Column(db.Integer, default=0) # Percentage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'progress': self.progress,
            'created_at': self.created_at.isoformat()
        }

class FocusSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'duration_minutes': self.duration_minutes,
            'completed_at': self.completed_at.isoformat()
        }

class UserSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    daily_goal_hours = db.Column(db.Integer, default=4)
    auto_start_break = db.Column(db.Boolean, default=True)
    strict_mode = db.Column(db.Boolean, default=False)
    sound_volume = db.Column(db.Integer, default=70) # percentage
    
    def to_dict(self):
        return {
            'daily_goal_hours': self.daily_goal_hours,
            'auto_start_break': self.auto_start_break,
            'strict_mode': self.strict_mode,
            'sound_volume': self.sound_volume
        }

# Create Tables
with app.app_context():
    db.create_all()

# --- ROUTES ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        # AJAX login handling
        data = request.get_json()
        if not data: return jsonify({'error': 'Invalid request'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        
        return jsonify({'error': 'Invalid email or password'}), 401
        
    return render_template('auth.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data: return jsonify({'error': 'Invalid request'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
        
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    login_user(new_user)
    return jsonify({'success': True, 'redirect': url_for('dashboard')})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/progress')
@login_required
def progress():
    return render_template('progress.html')

@app.route('/planner')
@login_required
def planner():
    return render_template('planner.html')

@app.route('/goals')
@login_required
def goals():
    return render_template('goals.html')


# --- API ROUTES FOR TASKS ---

@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])

@app.route('/api/tasks', methods=['POST'])
@login_required
def add_task():
    data = request.get_json()
    if not data or not 'title' in data:
        return jsonify({'error': 'Title is required'}), 400
    
    new_task = Task(title=data['title'], user_id=current_user.id)
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify(new_task.to_dict()), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
def manage_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    
    if request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'}), 200
        
    elif request.method == 'PUT':
        data = request.get_json()
        if 'completed' in data:
            task.completed = data['completed']
        if 'title' in data:
            task.title = data['title']
            
        db.session.commit()
        return jsonify(task.to_dict()), 200


# --- API ROUTES FOR GOALS ---

@app.route('/api/goals', methods=['GET'])
@login_required
def get_goals():
    goals = Goal.query.filter_by(user_id=current_user.id).order_by(Goal.created_at.desc()).all()
    return jsonify([g.to_dict() for g in goals])

@app.route('/api/goals', methods=['POST'])
@login_required
def add_goal():
    data = request.get_json()
    if not data or not 'title' in data:
        return jsonify({'error': 'Title is required'}), 400
        
    new_goal = Goal(title=data['title'], progress=data.get('progress', 0), user_id=current_user.id)
    db.session.add(new_goal)
    db.session.commit()
    
    return jsonify(new_goal.to_dict()), 201


# --- API ROUTES FOR SESSIONS (ANALYTICS) ---

@app.route('/api/sessions', methods=['GET'])
@login_required
def get_sessions():
    sessions = FocusSession.query.filter_by(user_id=current_user.id).order_by(FocusSession.completed_at.desc()).all()
    return jsonify([s.to_dict() for s in sessions])

@app.route('/api/sessions', methods=['POST'])
@login_required
def add_session():
    data = request.get_json()
    if not data or 'duration_minutes' not in data:
        return jsonify({'error': 'duration_minutes is required'}), 400
        
    new_session = FocusSession(duration_minutes=data['duration_minutes'], user_id=current_user.id)
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify(new_session.to_dict()), 201

@app.route('/api/analytics', methods=['GET'])
@login_required
def get_analytics():
    sessions = FocusSession.query.filter_by(user_id=current_user.id).all()
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    
    total_minutes = sum(s.duration_minutes for s in sessions)
    total_hours = round(total_minutes / 60, 1)
    tasks_completed = sum(1 for t in tasks if t.completed)
    
    return jsonify({
        'total_focus_hours': total_hours,
        'total_sessions': len(sessions),
        'tasks_planned': len(tasks),
        'tasks_completed': tasks_completed
    })

# --- API ROUTES FOR SETTINGS ---

@app.route('/api/settings', methods=['GET'])
@login_required
def get_settings():
    settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict())

@app.route('/api/settings', methods=['PUT'])
@login_required
def update_settings():
    data = request.get_json()
    settings = UserSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.session.add(settings)
    
    if 'daily_goal_hours' in data:
        settings.daily_goal_hours = data['daily_goal_hours']
    if 'auto_start_break' in data:
        settings.auto_start_break = data['auto_start_break']
    if 'strict_mode' in data:
        settings.strict_mode = data['strict_mode']
    if 'sound_volume' in data:
        settings.sound_volume = data['sound_volume']
        
    db.session.commit()
    return jsonify(settings.to_dict()), 200

if __name__ == '__main__':
    print("Welcome to Focus Buddy Backend!")
    print("Database connected. Starting server...")
    app.run(debug=True, port=5000)