// Automatically detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

document.getElementById('statusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById('phone').value.trim();
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!phone) {
        return;
    }

    // Show loading state
    resultsContainer.innerHTML = '<div class="no-results">Searching...</div>';

    try {
        const response = await fetch(`${API_URL}/appointments/status?phone=${encodeURIComponent(phone)}`);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server is not responding correctly. Please make sure the backend is running.');
        }
        
        const data = await response.json();

        if (response.ok && data.appointments && data.appointments.length > 0) {
            displayResults(data.appointments);
        } else {
            resultsContainer.innerHTML = '<div class="no-results">No appointments found for this phone number.</div>';
        }
    } catch (error) {
        console.error('Error fetching status:', error);
        let errorMessage = error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:5000';
        }
        resultsContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
    }
});

function displayResults(appointments) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    const html = appointments.map(apt => `
        <div class="result-card">
            <h3>${apt.name}</h3>
            <div class="result-info">
                <div class="result-row">
                    <span class="result-label">Role:</span>
                    <span class="result-value">${apt.role}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Email:</span>
                    <span class="result-value">${apt.email}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Phone:</span>
                    <span class="result-value">${apt.phone}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Preferred Date:</span>
                    <span class="result-value">${apt.preferred_date}</span>
                </div>
                ${apt.assigned_time ? `
                <div class="result-row">
                    <span class="result-label">Assigned Time:</span>
                    <span class="result-value">${apt.assigned_time}</span>
                </div>
                ` : ''}
                <div class="result-row">
                    <span class="result-label">Status:</span>
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                <div class="result-row">
                    <span class="result-label">Reason:</span>
                    <span class="result-value">${apt.meeting_reason}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
}
