// Mood Journal - Frontend Application
import Chart from 'chart.js/auto';

// Global variables
let emotionChart = null;
let trendChart = null;

// Sentiment analysis using keyword matching
function analyzeSentiment(text) {
    if (!text) return { label: 'neutral', score: 0.5, emoji: '😐' };
    
    const lowerText = text.toLowerCase();
    
    const positiveKeywords = [
        'happy', 'joy', 'great', 'good', 'love', 'amazing', 'wonderful', 
        'excited', 'proud', 'grateful', 'fantastic', 'awesome', 'brilliant',
        'excellent', 'perfect', 'beautiful', 'success', 'achievement', 'win'
    ];
    
    const negativeKeywords = [
        'sad', 'bad', 'angry', 'terrible', 'hate', 'upset', 'awful', 
        'depressed', 'anxious', 'worried', 'frustrated', 'disappointed',
        'stressed', 'overwhelmed', 'lonely', 'hurt', 'pain', 'fail'
    ];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) positiveScore++;
    });
    
    negativeKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) {
        const confidence = Math.min(0.95, 0.6 + (positiveScore - negativeScore) * 0.1);
        return { label: 'positive', score: confidence, emoji: '😊' };
    } else if (negativeScore > positiveScore) {
        const confidence = Math.min(0.95, 0.6 + (negativeScore - positiveScore) * 0.1);
        return { label: 'negative', score: confidence, emoji: '😢' };
    } else {
        return { label: 'neutral', score: 0.5, emoji: '😐' };
    }
}

// Local storage functions
function saveEntry(entry) {
    const entries = getEntries();
    entry.id = Date.now();
    entry.created_at = new Date().toISOString();
    entries.unshift(entry);
    localStorage.setItem('moodJournalEntries', JSON.stringify(entries));
    return entry;
}

function getEntries() {
    const stored = localStorage.getItem('moodJournalEntries');
    return stored ? JSON.parse(stored) : [];
}

function deleteEntry(entryId) {
    const entries = getEntries();
    const filtered = entries.filter(entry => entry.id !== entryId);
    localStorage.setItem('moodJournalEntries', JSON.stringify(filtered));
}

function getStats() {
    const entries = getEntries();
    
    const emotionStats = entries.reduce((acc, entry) => {
        const emotion = entry.emotion;
        const existing = acc.find(stat => stat.emotion === emotion);
        if (existing) {
            existing.count++;
        } else {
            acc.push({ emotion, count: 1, emoji_feedback: entry.emoji_feedback });
        }
        return acc;
    }, []);
    
    return {
        emotion_stats: emotionStats,
        recent_entries: entries.slice(0, 20)
    };
}

// Initialize demo data if none exists
function initializeDemoData() {
    const entries = getEntries();
    if (entries.length === 0) {
        const demoEntries = [
            {
                id: 1,
                text: "I'm feeling really happy today! The weather is perfect and I accomplished all my goals.",
                emotion: "positive",
                confidence: 0.95,
                emoji_feedback: "😊",
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 2,
                text: "Feeling a bit down today. Work was stressful and I couldn't focus.",
                emotion: "negative",
                confidence: 0.87,
                emoji_feedback: "😢",
                created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 3,
                text: "Just a regular day, nothing special happened. Went through my routine.",
                emotion: "neutral",
                confidence: 0.72,
                emoji_feedback: "😐",
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                text: "Amazing news! I got the promotion I wanted! So excited for this new opportunity.",
                emotion: "positive",
                confidence: 0.98,
                emoji_feedback: "😊",
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 5,
                text: "Feeling anxious about tomorrow's presentation. Hope everything goes well.",
                emotion: "negative",
                confidence: 0.89,
                emoji_feedback: "😢",
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        localStorage.setItem('moodJournalEntries', JSON.stringify(demoEntries));
        console.log('Demo data initialized');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mood Journal app initialized');
    
    // Initialize demo data
    initializeDemoData();

    // Load initial data
    loadEntries();
    loadStats();

    // Form submission
    document.getElementById('journalForm').addEventListener('submit', handleFormSubmit);

    showMessage('Welcome to your Mood Journal! Start by writing about your day.', 'info');
});

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');

    const text = document.getElementById('journalText').value.trim();
    if (!text) {
        showMessage('Please enter some text', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    submitBtn.disabled = true;

    try {
        // Analyze sentiment
        const sentiment = analyzeSentiment(text);
        
        // Create entry
        const entry = {
            text: text,
            emotion: sentiment.label,
            confidence: sentiment.score,
            emoji_feedback: sentiment.emoji
        };

        // Save entry
        const savedEntry = saveEntry(entry);
        console.log('Entry saved:', savedEntry);

        // Clear form
        document.getElementById('journalText').value = '';
        
        // Reload data
        loadEntries();
        loadStats();
        
        showMessage(`Entry saved! Detected emotion: ${sentiment.label} (${Math.round(sentiment.score * 100)}% confidence)`, 'success');
        
    } catch (error) {
        console.error('Error saving entry:', error);
        showMessage('Error saving entry. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Load journal entries
function loadEntries() {
    try {
        console.log('Loading entries...');
        const entries = getEntries();
        console.log('Entries loaded:', entries);

        const entriesList = document.getElementById('entriesList');

        if (entries.length === 0) {
            entriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No entries yet</h3>
                    <p>Write your first journal entry to get started!</p>
                </div>
            `;
            return;
        }

        entriesList.innerHTML = entries.map(entry => `
            <div class="entry-item">
                <div class="entry-header">
                    <span class="entry-date">${formatDate(entry.created_at)}</span>
                    <span class="emotion-badge emotion-${entry.emotion}">
                        ${entry.emoji_feedback} ${entry.emotion}
                    </span>
                </div>
                <div class="entry-text">${entry.text}</div>
                <div class="confidence-score">
                    Confidence: ${Math.round((entry.confidence || 0.5) * 100)}%
                </div>
                <button class="btn btn-danger" onclick="handleDeleteEntry(${entry.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading entries:', error);
        document.getElementById('entriesList').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b; padding: 40px;">Error loading entries</p>';
    }
}

// Load statistics
function loadStats() {
    try {
        console.log('Loading stats...');
        const stats = getStats();
        console.log('Stats loaded:', stats);

        updateStatsGrid(stats.emotion_stats);
        updateEmotionChart(stats.emotion_stats);
        updateTrendChart(stats.recent_entries);

    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('statsGrid').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b;">Error loading stats</p>';
    }
}

// Update stats grid
function updateStatsGrid(emotionStats) {
    const statsGrid = document.getElementById('statsGrid');

    if (!emotionStats || emotionStats.length === 0) {
        statsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <p>No statistics available yet</p>
            </div>
        `;
        return;
    }

    statsGrid.innerHTML = emotionStats.map(stat => `
        <div class="stat-card">
            <div class="stat-number">${stat.count}</div>
            <div class="stat-label">${stat.emotion}</div>
        </div>
    `).join('');
}

// Update emotion chart
function updateEmotionChart(emotionStats) {
    const canvas = document.getElementById('emotionChart');
    if (!canvas) return;
    
    if (emotionChart) {
        emotionChart.destroy();
    }
    
    if (!emotionStats || emotionStats.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    
    const colors = {
        'positive': '#28a745',
        'negative': '#dc3545',
        'neutral': '#6c757d'
    };
    
    try {
        const ctx = canvas.getContext('2d');
        emotionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: emotionStats.map(stat => stat.emotion),
                datasets: [{
                    data: emotionStats.map(stat => stat.count),
                    backgroundColor: emotionStats.map(stat => colors[stat.emotion] || '#667eea'),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = emotionStats.reduce((sum, stat) => sum + stat.count, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    } catch (error) {
        console.error('Error creating emotion chart:', error);
    }
}

// Update trend chart
function updateTrendChart(recentEntries) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    if (!recentEntries || recentEntries.length === 0) {
        canvas.style.display = 'none';
        return;
    }
    
    canvas.style.display = 'block';
    
    const emotionValues = {
        'positive': 1,
        'neutral': 0,
        'negative': -1
    };
    
    // Sort entries by date and take last 20
    const sortedEntries = recentEntries
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-20);
    
    const data = sortedEntries.map((entry, index) => ({
        x: index,
        y: emotionValues[entry.emotion] || 0,
        date: entry.created_at
    }));
    
    try {
        const ctx = canvas.getContext('2d');
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, index) => `Entry ${index + 1}`),
                datasets: [{
                    label: 'Mood Trend',
                    data: data.map(point => point.y),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: data.map(point => {
                        if (point.y === 1) return '#28a745';
                        if (point.y === -1) return '#dc3545';
                        return '#6c757d';
                    }),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Journal Entries (Chronological)'
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        min: -1.2,
                        max: 1.2,
                        title: {
                            display: true,
                            text: 'Mood Level'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                if (value === 1) return 'Positive';
                                if (value === 0) return 'Neutral';
                                if (value === -1) return 'Negative';
                                return '';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                return formatDate(data[index]?.date) || `Entry ${index + 1}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                if (value === 1) return 'Mood: Positive';
                                if (value === 0) return 'Mood: Neutral';
                                if (value === -1) return 'Mood: Negative';
                                return `Mood: ${value}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}

// Delete entry handler
function handleDeleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
        deleteEntry(entryId);
        loadEntries();
        loadStats();
        showMessage('Entry deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting entry:', error);
        showMessage('Error deleting entry', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<i class="fas fa-${getMessageIcon(type)}"></i> ${message}`;

    // Clear message after 5 seconds
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 5000);
}

function getMessageIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

// Utility functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
        return dateString;
    }
}

// Make functions globally available
window.handleDeleteEntry = handleDeleteEntry;

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showMessage('An error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showMessage('Network error occurred. Please try again.', 'error');
});