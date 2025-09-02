from flask import Flask, request, jsonify, render_template
import mysql.connector
import requests
import json
import os
from datetime import datetime, timedelta
import webbrowser
import threading
import time
from config import DB_CONFIG, HUGGING_FACE_API_URL, API_TOKEN, FLASK_CONFIG

app = Flask(__name__)

# Database configuration
db_config = DB_CONFIG

# Hugging Face API configuration
HUGGING_FACE_API_URL = HUGGING_FACE_API_URL
API_TOKEN = os.getenv("HF_API_TOKEN", API_TOKEN)

def create_database():
    """Create database and tables if they don't exist, ensuring emoji_feedback column"""
    try:
        conn = mysql.connector.connect(
            host=db_config['host'],
            user=db_config['user'],
            password=db_config['password']
        )
        cursor = conn.cursor()
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS mood_journal")
        cursor.execute("USE mood_journal")
        
        # Create or alter entries table to include emoji_feedback
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                text TEXT NOT NULL,
                emotion VARCHAR(50),
                confidence FLOAT,
                emoji_feedback VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Ensure emoji_feedback exists even if table was pre-existing
        cursor.execute("SHOW COLUMNS FROM entries LIKE 'emoji_feedback'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE entries ADD COLUMN emoji_feedback VARCHAR(10) AFTER confidence")
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Database and tables created/updated successfully!")
        
    except Exception as e:
        print(f"Database creation error: {e}")

def create_demo_data():
    """Create 20 demo entries only if the database is empty"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Check if table is empty
        cursor.execute("SELECT COUNT(*) FROM entries")
        count = cursor.fetchone()[0]
        
        if count == 0:
            demo_entries = [
                ("I'm feeling really happy today! The weather is perfect.", "positive", 0.95, "😊", "2025-08-25 10:00:00"),
                ("Feeling a bit down today. Work was stressful.", "negative", 0.87, "😢", "2025-08-26 14:00:00"),
                ("Just a regular day, nothing special happened.", "neutral", 0.72, "😐", "2025-08-27 18:00:00"),
                ("Amazing news! I got the promotion I wanted!", "positive", 0.98, "😊", "2025-08-28 09:00:00"),
                ("Feeling anxious about tomorrow's presentation.", "negative", 0.89, "😢", "2025-08-29 13:00:00"),
                ("Had a nice lunch with colleagues.", "positive", 0.76, "😊", "2025-08-30 17:00:00"),
                ("Feeling overwhelmed with all the tasks.", "negative", 0.91, "😢", "2025-08-31 11:00:00"),
                ("Productive day at work, completed several projects.", "positive", 0.83, "😊", "2025-09-01 09:00:00"),
                ("Feeling neutral about today's events.", "neutral", 0.68, "😐", "2025-09-01 10:00:00"),
                ("Great workout session, feeling energized!", "positive", 0.94, "😊", "2025-09-01 11:00:00"),
                ("Feeling sad about missing the family dinner.", "negative", 0.85, "😢", "2025-09-01 12:00:00"),
                ("Regular day at home, nothing out of the ordinary.", "neutral", 0.71, "😐", "2025-09-01 13:00:00"),
                ("Excited about the weekend plans!", "positive", 0.92, "😊", "2025-09-01 14:00:00"),
                ("Feeling frustrated with technical issues.", "negative", 0.88, "😢", "2025-09-01 14:30:00"),
                ("Peaceful evening reading a book.", "neutral", 0.75, "😐", "2025-09-01 15:00:00"),
                ("Wonderful surprise from my partner!", "positive", 0.96, "😊", "2025-09-01 15:30:00"),
                ("Feeling lonely today.", "negative", 0.86, "😢", "2025-09-01 16:00:00"),
                ("Good conversation with an old friend.", "positive", 0.79, "😊", "2025-09-01 16:30:00"),
                ("Feeling indifferent about current events.", "neutral", 0.69, "😐", "2025-09-01 17:00:00"),
                ("Achieved a personal goal today!", "positive", 0.93, "😊", "2025-09-01 17:30:00")
            ]
            
            cursor.executemany(
                "INSERT INTO entries (text, emotion, confidence, emoji_feedback, created_at) VALUES (%s, %s, %s, %s, %s)",
                demo_entries
            )
            conn.commit()
            
            cursor.execute("SELECT COUNT(*) FROM entries WHERE emotion = 'positive'")
            positive = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM entries WHERE emotion = 'negative'")
            negative = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM entries WHERE emotion = 'neutral'")
            neutral = cursor.fetchone()[0]
            
            print("✅ Created 20 demo entries with varied emotions and timestamps!")
            print(f"📊 Current emotion distribution:\n   Positive: {positive}\n   Negative: {negative}\n   Neutral: {neutral}")
            print("✅ Demo data created successfully!")
        else:
            print("ℹ️ Database already contains entries. Skipping demo data creation to preserve existing data.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Failed to create demo data: {e}")

def _heuristic_sentiment(text: str) -> dict:
    """Simple keyword-based fallback when no API token is configured."""
    if not text:
        return {"label": "neutral", "score": 0.5, "emoji": "😐"}
    lower = text.lower()
    positive_keywords = [
        "happy", "joy", "great", "good", "love", "amazing", "wonderful", "excited", "proud", "grateful"
    ]
    negative_keywords = [
        "sad", "bad", "angry", "terrible", "hate", "upset", "awful", "depressed", "anxious", "worried"
    ]
    pos_hits = sum(1 for k in positive_keywords if k in lower)
    neg_hits = sum(1 for k in negative_keywords if k in lower)
    emoji_map = {"positive": "😊", "negative": "😢", "neutral": "😐"}
    if pos_hits > neg_hits:
        score = min(1.0, 0.6 + 0.1 * (pos_hits - neg_hits))
        return {"label": "positive", "score": score, "emoji": emoji_map["positive"]}
    if neg_hits > pos_hits:
        score = min(1.0, 0.6 + 0.1 * (neg_hits - pos_hits))
        return {"label": "negative", "score": score, "emoji": emoji_map["negative"]}
    return {"label": "neutral", "score": 0.5, "emoji": emoji_map["neutral"]}

def _normalize_label(raw_label: str) -> str:
    """Map various label formats to one of: positive, neutral, negative."""
    if not raw_label:
        return "neutral"
    label = str(raw_label).strip().lower()
    if label.startswith("label_"):
        try:
            idx = int(label.split("_")[-1])
            return {0: "negative", 1: "neutral", 2: "positive"}.get(idx, "neutral")
        except Exception:
            return "neutral"
    mapping = {"pos": "positive", "neg": "negative", "neu": "neutral"}
    if label in mapping:
        return mapping[label]
    if label in ("positive", "negative", "neutral"):
        return label
    return "neutral"

def analyze_sentiment(text):
    """Analyze sentiment using Hugging Face API with robust parsing.
    Falls back to a simple heuristic if no API token is configured.
    """
    emoji_map = {"positive": "😊", "negative": "😢", "neutral": "😐"}
    if not API_TOKEN:
        result = _heuristic_sentiment(text)
        return {"label": result["label"], "score": result["score"], "emoji": result["emoji"]}
    
    headers = {"Authorization": f"Bearer {API_TOKEN}"}
    payload = {"inputs": text}
    
    try:
        response = requests.post(HUGGING_FACE_API_URL, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            result = response.json()
            candidates = []
            if isinstance(result, list) and result:
                if isinstance(result[0], dict):
                    candidates = result
                elif isinstance(result[0], list):
                    candidates = result[0]
            if candidates:
                best = max(candidates, key=lambda c: float(c.get("score", 0)))
                emotion = _normalize_label(best.get("label"))
                confidence = float(best.get("score", 0.5))
                emoji = emoji_map.get(emotion, "😐")
                return {"label": emotion, "score": confidence, "emoji": emoji}
        return _heuristic_sentiment(text)
    except Exception as e:
        print(f"API Error: {e}")
        return _heuristic_sentiment(text)

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/entries', methods=['GET'])
def get_entries():
    """Get all journal entries"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, text, emotion, confidence, emoji_feedback, created_at 
            FROM entries 
            ORDER BY created_at DESC
        """)
        
        entries = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(entries)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/entries', methods=['POST'])
def add_entry():
    """Add a new journal entry"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        # Analyze sentiment
        sentiment_result = analyze_sentiment(text)
        emotion = sentiment_result.get('label', 'neutral')
        emotion_score = sentiment_result.get('score', 0.5)
        emoji = sentiment_result.get('emoji', '😐')
        
        # Save to database WITH emoji_feedback
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO entries (text, emotion, confidence, emoji_feedback) 
            VALUES (%s, %s, %s, %s)
        """, (text, emotion, emotion_score, emoji))
        
        entry_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "id": entry_id,
            "text": text,
            "emotion": emotion,
            "emotion_score": emotion_score,
            "emoji_feedback": emoji,
            "created_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    """Delete a journal entry"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Verify entry exists before deletion
        cursor.execute("SELECT id FROM entries WHERE id = %s", (entry_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Entry not found"}), 404
        
        cursor.execute("DELETE FROM entries WHERE id = %s", (entry_id,))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Entry deleted successfully"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """Get mood statistics"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get emotion counts
        cursor.execute("""
            SELECT emotion, emoji_feedback, COUNT(*) as count 
            FROM entries 
            GROUP BY emotion, emoji_feedback
        """)
        
        emotion_stats = cursor.fetchall()
        
        # Get recent entries for trend
        cursor.execute("""
            SELECT emotion, emoji_feedback, created_at 
            FROM entries 
            ORDER BY created_at DESC 
            LIMIT 20
        """)
        
        recent_entries = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "emotion_stats": emotion_stats,
            "recent_entries": recent_entries
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

browser_opened = False  # Global flag to prevent multiple browser opens

def open_browser():
    global browser_opened
    time.sleep(2)
    if not browser_opened:
        try:
            webbrowser.open('http://127.0.0.1:5000')  # Explicitly open 127.0.0.1:5000
            print("✅ Browser opened successfully at http://127.0.0.1:5000!")
            browser_opened = True
        except Exception as e:
            print(f"⚠️ Could not open browser automatically: {e}")
            print("🌐 Please manually open: http://127.0.0.1:5000")

if __name__ == '__main__':
    # Start browser opening in a separate thread if debug
    if FLASK_CONFIG['debug']:
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
    
    print("🚀 Starting Mood Journal...")
    if FLASK_CONFIG['debug']:
        print("🌐 Opening browser automatically at http://127.0.0.1:5000...")
        print("💡 If browser doesn't open, go to: http://127.0.0.1:5000")
    create_database()
    if os.getenv('CREATE_DEMO_DATA', 'true').lower() == 'true':
        create_demo_data()
    app.run(**FLASK_CONFIG)