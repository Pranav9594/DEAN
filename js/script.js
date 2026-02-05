// Automatically detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';
let adminToken = null;

// Set minimum date to tomorrow
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('preferredDate');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
});

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Book Appointment
document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('name').value,
        role: document.getElementById('role').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        meetingReason: document.getElementById('meetingReason').value,
        preferredDate: document.getElementById('preferredDate').value
    };

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.success) {
            document.getElementById('bookResult').className = 'result success';
            document.getElementById('bookResult').innerHTML = `
                <h3>Appointment Requested!</h3>
                <p>Reference ID: <strong>${result.referenceId}</strong></p>
                <p>Save this ID to check your appointment status.</p>
            `;
            document.getElementById('appointmentForm').reset();
        }
    } catch (err) {
        document.getElementById('bookResult').className = 'result error';
        document.getElementById('bookResult').textContent = 'Error submitting appointment';
    }
});

// Check Status
async function checkStatus() {
    const refId = document.getElementById('refId').value.trim();
    if (!refId) return;

    try {
        const res = await fetch(`${API_URL}/appointments/${refId}`);
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('statusResult').className = 'result success';
            document.getElementById('statusResult').innerHTML = `
                <div class="appointment-card">
                    <h3>${data.name}</h3>
                    <p><strong>Role:</strong> ${data.role}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Preferred Date:</strong> ${data.preferred_date}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></p>
                    ${data.assigned_time ? `<p><strong>Assigned Time:</strong> ${data.assigned_time}</p>` : ''}
                    <p><strong>Reason:</strong> ${data.meeting_reason}</p>
                </div>
            `;
        } else {
            document.getElementById('statusResult').className = 'result error';
            document.getElementById('statusResult').textContent = 'Appointment not found';
        }
    } catch (err) {
        document.getElementById('statusResult').className = 'result error';
        document.getElementById('statusResult').textContent = 'Error checking status';
    }
}

// Admin Login
async function adminLogin() {
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;

    try {
        const res = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        
        if (data.success) {
            adminToken = data.token;
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadAppointments('pending');
        } else {
            alert('Invalid credentials');
        }
    } catch (err) {
        alert('Login error');
    }
}

// Load Appointments
async function loadAppointments(status) {
    try {
        const res = await fetch(`${API_URL}/admin/appointments?status=${status}`);
        const appointments = await res.json();
        
        const list = document.getElementById('appointmentsList');
        if (appointments.length === 0) {
            list.innerHTML = '<p>No appointments found</p>';
            return;
        }

        list.innerHTML = appointments.map(apt => `
            <div class="appointment-card">
                <h3>${apt.name} (${apt.role})</h3>
                <p><strong>Email:</strong> ${apt.email} | <strong>Phone:</strong> ${apt.phone}</p>
                <p><strong>Preferred Date:</strong> ${apt.preferred_date}</p>
                <p><strong>Reason:</strong> ${apt.meeting_reason}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${apt.status}">${apt.status.toUpperCase()}</span></p>
                ${apt.assigned_time ? `<p><strong>Time:</strong> ${apt.assigned_time}</p>` : ''}
                ${apt.status === 'pending' ? `
                    <select class="time-slot" id="time-${apt.id}">
                        <option value="">Select Time</option>
                        ${generateTimeSlots()}
                    </select>
                    <div class="action-buttons">
                        <button class="approve-btn" onclick="updateAppointment(${apt.id}, 'approved')">Approve</button>
                        <button class="reject-btn" onclick="updateAppointment(${apt.id}, 'rejected')">Reject</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('appointmentsList').innerHTML = '<p>Error loading appointments</p>';
    }
}

// Generate Time Slots
function generateTimeSlots() {
    const slots = [];
    for (let h = 9; h <= 16; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 16 && m > 30) break;
            const hour = h > 12 ? h - 12 : h;
            const period = h >= 12 ? 'PM' : 'AM';
            const time = `${hour}:${m.toString().padStart(2, '0')} ${period}`;
            slots.push(`<option value="${time}">${time}</option>`);
        }
    }
    return slots.join('');
}

// Update Appointment
async function updateAppointment(id, status) {
    const timeSelect = document.getElementById(`time-${id}`);
    const assignedTime = timeSelect ? timeSelect.value : null;
    
    if (status === 'approved' && !assignedTime) {
        alert('Please select a time slot');
        return;
    }

    try {
        const body = status === 'approved' 
            ? {status, assignedTime}
            : {status};

        await fetch(`${API_URL}/admin/appointments/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        
        loadAppointments('pending');
    } catch (err) {
        alert('Error updating appointment');
    }
}
