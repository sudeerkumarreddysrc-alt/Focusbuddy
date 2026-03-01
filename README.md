# 🎯 FocusBuddy — Anti-Procrastination Portal

**FocusBuddy** is a full-stack anti-procrastination web portal built with Python Flask, designed to help you manage tasks, track long-term goals, and stay focused using the Pomodoro technique.

> Built with ❤️ by **Team Acetone**

---

## ✨ Features

- 🔐 **User Authentication** — Secure login & signup system
- ⏱️ **Pomodoro Timer** — 25m / 50m / 120m focus sessions
- 🔒 **Focus Lock Mode** — Fullscreen distraction-free mode with YouTube lecture viewer
- 📋 **Task Planner** — To-do list with interactive calendar
- 🎯 **Long-Term Goal Tracker** — Set goals with progress bars
- 🎵 **Focus Sounds** — Ambient sounds (Rainy Lofi, Coffee Jazz, Cozy Piano, Space)
- 📊 **Productivity Analytics** — Track streaks, focus hours, tasks done
- ⚙️ **Settings Panel** — Strict mode, auto-break, volume controls

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/focusbuddy.git
cd focusbuddy
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the app
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| Database | SQLite (via Flask-SQLAlchemy) |
| Auth | Flask-Login, Werkzeug |
| Frontend | HTML5, CSS3, JavaScript |
| Fonts | Google Fonts (Outfit, Inter) |
| Icons | Font Awesome 6 |

---

## 📁 Project Structure

```
focusbuddy/
├── app.py                  # Flask application & API routes
├── requirements.txt        # Python dependencies
├── templates/
│   ├── index.html          # Landing page
│   ├── auth.html           # Login / Signup
│   ├── dashboard.html      # Main dashboard
│   ├── planner.html        # Task planner
│   ├── goals.html          # Goal tracker
│   └── progress.html       # Progress analytics
└── static/
    ├── css/                # Stylesheets
    ├── js/                 # JavaScript files
    └── img/                # Images & logos
```

---

## 👥 Team

**Team Acetone** — Building tools that fight procrastination, one focus session at a time.
