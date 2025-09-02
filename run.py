#!/usr/bin/env python3
"""
Mood Journal - Startup Script
This script checks dependencies and starts the application.
"""

import sys
import subprocess
import importlib.util
import mysql.connector
from config import DB_CONFIG

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Error: Python 3.7 or higher is required!")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'flask',
        'mysql.connector',
        'requests'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        if importlib.util.find_spec(package) is None:
            missing_packages.append(package)
        else:
            print(f"✅ {package} is installed")
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    
    return True

def check_mysql():
    """Check if MySQL is accessible"""
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        conn.close()
        print("✅ MySQL connection successful")
        return True
    except Exception as e:
        print(f"⚠️ MySQL connection failed: {e}")
        print("Please make sure MySQL is running and credentials are correct in config.py")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Mood Journal - AI-Powered Emotion Tracker")
    print("=" * 50)
    
    if not check_python_version():
        sys.exit(1)
    
    if not check_dependencies():
        sys.exit(1)
    
    mysql_ok = check_mysql()
    
    print("\n" + "=" * 50)
    
    if mysql_ok:
        print("🎉 All checks passed! Starting the application...")
    else:
        print("⚠️ Some checks failed, but the application will start anyway.")
        print("   You may need to configure MySQL or the Hugging Face API token.")
    
    print("\n📝 To configure the application:")
    print("   1. Edit config.py to set your MySQL password")
    print("   2. Add your Hugging Face API token for real sentiment analysis")
    print("   3. The app will work with API token provided")
    
    print("\n🌐 The application will be available at: http://localhost:5000")
    print("=" * 50)
    
    try:
        from app import app, create_database
        create_database()
        # Check if entries table is empty before creating demo data
        conn = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database=DB_CONFIG['database']
        )
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM entries')
        if cursor.fetchone()[0] == 0:
            from app import create_demo_data
            create_demo_data()  # Populate demo data only if table is empty
        cursor.close()
        conn.close()
        
        app.run(**app.config.get('FLASK_CONFIG', {
            'debug': True,
            'host': '0.0.0.0',
            'port': 5000
        }))
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()