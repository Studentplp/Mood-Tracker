# Mood Journal - AI-Powered Emotion Tracker

A beautiful web application that helps you track your emotions using AI-powered sentiment analysis. Write journal entries and get instant feedback on your emotional state with visual charts and statistics.

## 🌟 Features

- **AI-Powered Sentiment Analysis**: Uses Hugging Face's sentiment analysis API to analyze your journal entries
- **Beautiful Modern UI**: Clean, responsive design with gradient backgrounds and smooth animations
- **Real-time Charts**: Visualize your mood trends with interactive charts using Chart.js
- **Full CRUD Operations**: Create, read, update, and delete journal entries
- **Emotion Statistics**: Track your emotional patterns over time
- **Confidence Scores**: See how confident the AI is in its emotion analysis
- **Mobile Responsive**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python Flask
- **Database**: MySQL
- **AI**: Hugging Face Sentiment Analysis API
- **Charts**: Chart.js
- **Icons**: Font Awesome

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Python 3.7+** installed on your system
2. **MySQL Server** installed and running
3. **Hugging Face API Token** (optional, but recommended for real sentiment analysis)

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url>
cd mood-journal

# Or simply download and extract the files
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Database

1. **Start MySQL Server** on your system
2. **Update Database Configuration** in `app.py`:
   ```python
   db_config = {
       'host': 'localhost',
       'user': 'root',
       'password': 'your_mysql_password',  # Update this
       'database': 'mood_journal'
   }
   ```

### 4. Configure Hugging Face API (Optional)

For real sentiment analysis:

1. Go to [Hugging Face](https://huggingface.co/) and create an account
2. Get your API token from your profile settings
3. Update the `API_TOKEN` variable in `app.py`:
   ```python
   API_TOKEN = "your_hugging_face_token_here"
   ```


### 5. Run the Application

```bash
python app.py
```

The application will:
- Automatically create the database and tables
- Start the Flask server on `http://localhost:5000`
- Open your browser to the application

## 📖 How to Use

### Writing Journal Entries

1. **Open the application** in your web browser
2. **Write your thoughts** in the text area on the left
3. **Click "Analyze & Save Entry"** to process your text
4. **View the results** - your entry will be analyzed and saved

### Understanding the Results

- **Emotion Label**: The AI will classify your entry as positive, negative, or neutral
- **Confidence Score**: Shows how confident the AI is in its analysis (0-100%)
- **Visual Feedback**: Color-coded emotion badges and charts

### Viewing Statistics

- **Emotion Distribution**: Pie chart showing the breakdown of your emotions
- **Mood Trends**: Line chart tracking your emotional journey over time
- **Quick Stats**: Summary cards with emotion counts

## 🗄️ Database Schema

The application creates a simple database structure:

```sql
CREATE TABLE entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    emotion VARCHAR(50),
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 API Endpoints

- `GET /` - Main application page
- `GET /api/entries` - Get all journal entries
- `POST /api/entries` - Create a new journal entry
- `DELETE /api/entries/<id>` - Delete a specific entry
- `GET /api/stats` - Get emotion statistics

## 🎨 Customization

### Styling
The application uses CSS custom properties and can be easily customized:
- Colors are defined in CSS variables
- Font families can be changed in the CSS
- Layout can be modified using CSS Grid and Flexbox

### Adding Features
The modular structure makes it easy to add new features:
- New API endpoints can be added to `app.py`
- Additional charts can be implemented using Chart.js
- New UI components can be added to the HTML template

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running
   - Check your database credentials in `app.py`
   - Verify MySQL user permissions

2. **API Token Issues**
   - If you get API errors, check your Hugging Face token
   - The app will work with mock data if no token is provided

3. **Port Already in Use**
   - Change the port in `app.py`: `app.run(debug=True, port=5001)`

4. **Missing Dependencies**
   - Run `pip install -r requirements.txt` again
   - Check Python version compatibility

## 🤝 Contributing

This is a beginner-friendly project perfect for learning:
- **Zero AI Math**: Just API calls, no complex machine learning
- **Full CRUD Operations**: Learn database operations
- **Visual Feedback**: Instant gratification with charts
- **Modern Web Development**: HTML, CSS, JavaScript, Python, MySQL

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Hugging Face** for providing the sentiment analysis API
- **Chart.js** for the beautiful charting library
- **Font Awesome** for the icons
- **Flask** for the web framework

---

**Happy Journaling! 📝✨**
