// Automatically detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Set minimum date to tomorrow
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('preferredDate');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    
    // Close popup button
    document.getElementById('closePopup').addEventListener('click', () => {
        document.getElementById('successPopup').classList.remove('show');
    });
});

document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('fullName').value.trim(),
        role: document.getElementById('role').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        preferredDate: document.getElementById('preferredDate').value,
        meetingReason: document.getElementById('reason').value.trim()
    };

    const messageContainer = document.getElementById('messageContainer');
    const submitBtn = document.querySelector('.submit-btn');
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show popup
            const popup = document.getElementById('successPopup');
            popup.classList.add('show');
            
            // Reset form
            document.getElementById('appointmentForm').reset();
        } else {
            throw new Error(data.message || 'Failed to submit appointment');
        }
    } catch (error) {
        console.error('Error submitting appointment:', error);
        messageContainer.innerHTML = `
            <div class="error-message">
                <p>✗ Error submitting appointment request</p>
                <p style="margin-top: 8px; font-size: 14px;">${error.message || 'Please try again later.'}</p>
            </div>
        `;
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
    }
});
