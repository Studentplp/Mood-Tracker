// Global variables
let emotionChart = null;
let trendChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mood Journal app initialized');

    // Load initial data
    loadEntries();
    loadStats();

    // Form submission
    document.getElementById('journalForm').addEventListener('submit', handleFormSubmit);

    // Test API connection
    testAPIConnection();
});

// Test API connection
async function testAPIConnection() {
    try {
        const response = await fetch('/api/entries');
        if (response.ok) {
            console.log('✅ API connection successful');
            showMessage('Connected to server successfully', 'success');
        } else {
            console.error('❌ API connection failed:', response.status);
            showMessage('Server connection failed', 'error');
        }
    } catch (error) {
        console.error('❌ API connection error:', error);
        showMessage('Network connection failed. Please check if the server is running.', 'error');
    }
}

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
        console.log('Sending request to /api/entries');
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Entry saved:', result);
            document.getElementById('journalText').value = '';
            loadEntries();
            loadStats();
            showMessage('Entry saved successfully!', 'success');
        } else {
            const error = await response.json();
            console.error('Server error:', error);
            showMessage(error.error || 'Error saving entry', 'error');
        }
    } catch (error) {
        console.error('Network error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Load journal entries
async function loadEntries() {
    try {
        console.log('Loading entries...');
        const response = await fetch('/api/entries');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const entries = await response.json();
        console.log('Entries loaded:', entries);

        const entriesList = document.getElementById('entriesList');

        if (entries.length === 0) {
            entriesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No entries yet. Write your first journal entry!</p>';
            return;
        }

        entriesList.innerHTML = entries.map(entry => `
            <div class="entry-item">
                <div class="entry-header">
                    <span class="entry-date">${formatDate(entry.created_at)}</span>
                    <span class="emotion-badge emotion-${getEmotionClass(entry.emotion)}">
                        ${entry.emotion}
                    </span>
                </div>
                <div class="entry-text">${entry.text}</div>
                <div class="emoji-feedback" style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; text-align: center; font-size: 1.1rem;">
                    ${entry.emoji_feedback || '😊 Keep tracking your emotions!'}
                </div>
                <div class="emotion-score" style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    Emotion Score: ${Math.round((entry.emotion_score || entry.confidence || 0.5) * 100)}%
                </div>
                <button class="btn btn-danger" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9rem;" 
                        onclick="deleteEntry(${entry.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading entries:', error);
        document.getElementById('entriesList').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b; padding: 40px;">Error loading entries: ' + error.message + '</p>';
    }
}

// Load statistics
async function loadStats() {
    try {
        console.log('Loading stats...');
        const response = await fetch('/api/stats');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const stats = await response.json();
        console.log('Stats loaded:', stats);

        updateStatsGrid(stats.emotion_stats);
        updateEmotionChart(stats.emotion_stats);
        updateTrendChart(stats.recent_entries);

    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('statsGrid').innerHTML = 
            '<p style="text-align: center; color: #ff6b6b;">Error loading stats: ' + error.message + '</p>';
    }
}

// Update stats grid
function updateStatsGrid(emotionStats) {
    const statsGrid = document.getElementById('statsGrid');

    if (!emotionStats || emotionStats.length === 0) {
        statsGrid.innerHTML = '<p style="text-align: center; color: #666;">No data available</p>';
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
    if (!emotionStats || !emotionStats.length || emotionStats.every(stat => !stat.count)) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    
    // Define consistent colors for each emotion
    const colors = {
        'positive': '#28a745',  // Green
        'negative': '#dc3545',  // Red
        'neutral': '#6c757d'    // Grey
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
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
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
    if (!recentEntries || !recentEntries.length) {
        canvas.style.display = 'none';
        return;
    }
    canvas.style.display = 'block';
    
    const emotionValues = {
        'positive': 1,
        'neutral': 0,
        'negative': -1
    };
    
    // Sort entries by date (oldest first) and take the last 20
    const sortedEntries = recentEntries
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-20);
    
    // Create proper time-series data
    const data = sortedEntries.map((entry, index) => ({
        x: index,
        y: emotionValues[entry.emotion] || 0,
        label: formatDate(entry.created_at)
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
                        if (point.y === 1) return '#28a745';      // Green for positive
                        if (point.y === -1) return '#dc3545';     // Red for negative
                        return '#6c757d';                         // Grey for neutral
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
                                return data[index]?.label || `Entry ${index + 1}`;
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
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}

// Delete entry
async function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadEntries();
            loadStats();
            showMessage('Entry deleted successfully!', 'success');
        } else {
            showMessage('Error deleting entry', 'error');
        }
    } catch (error) {
        console.error('Error deleting entry:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Clear message after 5 seconds
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 5000);
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

function getEmotionClass(emotion) {
    if (emotion === 'positive') return 'positive';
    if (emotion === 'negative') return 'negative';
    return 'neutral';
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showMessage('JavaScript error occurred. Check console for details.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showMessage('Network error occurred. Please try again.', 'error');
});
