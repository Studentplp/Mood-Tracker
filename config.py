# Configuration file for Mood Journal Application

import os

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Ez5stara'),  # Set your MySQL password here or via env
    'database': os.getenv('DB_DATABASE', 'mood_journal')
}

# Hugging Face API Configuration
HUGGING_FACE_API_URL = os.getenv('HUGGING_FACE_API_URL', "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest")
API_TOKEN = os.getenv('HF_API_TOKEN', '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')  # Add your Hugging Face token here or via env

# Flask Configuration
FLASK_CONFIG = {
    'debug': os.getenv('FLASK_DEBUG', 'True') == 'True',
    'host': os.getenv('FLASK_HOST', '0.0.0.0'),  # Use 0.0.0.0 for binding, suitable for local and deployment
    'port': int(os.getenv('FLASK_PORT', 5000))
}

# Application Settings
APP_NAME = "Mood Journal"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = "AI-Powered Emotion Tracker"