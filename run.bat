@echo off
echo Starting Mood Journal - AI-Powered Emotion Tracker...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

REM Install dependencies if requirements.txt exists
if exist requirements.txt (
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Warning: Some dependencies may not have installed correctly
        echo The application may still work with basic functionality
    )
)

echo.
echo Starting the application...
echo The web interface will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application
echo.

REM Run the application
python run.py

pause
