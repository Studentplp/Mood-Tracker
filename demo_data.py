#!/usr/bin/env python3
"""
Demo Data Script for Mood Journal
This script populates the database with sample journal entries for demonstration.
"""

import mysql.connector
from datetime import datetime, timedelta
from config import DB_CONFIG

def create_demo_data():
    """Create demo data in the database"""
    try:
        # Connect to database
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Connected to database successfully!")
        
        # Check if entries table exists
        cursor.execute("SHOW TABLES LIKE 'entries'")
        if not cursor.fetchone():
            print("❌ Entries table does not exist. Please run the app first to create it.")
            return False
        
        # Clear existing demo data
        cursor.execute("DELETE FROM entries WHERE text LIKE '%demo%' OR text LIKE '%test%'")
        print("🗑️ Cleared existing demo data")
        
        # Demo entries with emoji_feedback and updated timestamps
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
        
        cursor.close()
        conn.close()
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main function"""
    print("🎭 Mood Journal - Demo Data Creator")
    print("=" * 40)
    
    response = input("This will clear existing entries and add demo data. Continue? (y/n): ")
    if response.lower() != 'y':
        print("Operation cancelled.")
        return
    
    if create_demo_data():
        print("\n🎉 Demo data created successfully!")
        print("Run 'python run.py' to start the application")
    else:
        print("\n❌ Failed to create demo data")

if __name__ == '__main__':
    main()