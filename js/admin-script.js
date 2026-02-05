// Automatically detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';
let adminToken = null;
let currentStatus = 'pending';

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
        adminToken = token;
        showDashboard();
        loadAppointments('pending');
    }
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');
    const errorDiv = document.getElementById('loginError');
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    errorDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            adminToken = data.token || 'admin-session';
            sessionStorage.setItem('adminToken', adminToken);
            showDashboard();
            loadAppointments('pending');
        } else {
            errorDiv.textContent = data.message || 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Error connecting to server. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    adminToken = null;
    sessionStorage.removeItem('adminToken');
    showLogin();
});

// Filter Tabs
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const status = tab.getAttribute('data-status');
        loadAppointments(status);
    });
});

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

async function loadAppointments(status) {
    currentStatus = status;
    const listContainer = document.getElementById('appointmentsList');
    
    listContainer.innerHTML = '<div class="no-appointments">Loading...</div>';

    try {
        const response = await fetch(`${API_URL}/admin/appointments?status=${status}`);
        const appointments = await response.json();

        if (appointments && appointments.length > 0) {
            displayAppointments(appointments);
        } else {
            listContainer.innerHTML = `<div class="no-appointments">No ${status} appointments found</div>`;
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        listContainer.innerHTML = '<div class="no-appointments">Error loading appointments</div>';
    }
}

function displayAppointments(appointments) {
    const listContainer = document.getElementById('appointmentsList');
    
    const html = appointments.map(apt => `
        <div class="appointment-card" data-id="${apt.id}">
            <h3>
                ${apt.name}
                <span class="role-badge">${apt.role}</span>
            </h3>
            <div class="appointment-details">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${apt.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${apt.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Preferred Date</span>
                    <span class="detail-value">${apt.preferred_date}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="status-badge status-${apt.status}">${apt.status}</span>
                </div>
                ${apt.assigned_time ? `
                <div class="detail-item">
                    <span class="detail-label">Assigned Time</span>
                    <span class="detail-value" id="assignedTime-${apt.id}">${apt.assigned_time}</span>
                </div>
                ` : ''}
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <span class="detail-label">Reason</span>
                    <span class="detail-value">${apt.meeting_reason}</span>
                </div>
            </div>
            ${apt.status === 'pending' ? `
                <div class="appointment-actions">
                    <select class="time-slot-select" id="timeSlot-${apt.id}">
                        <option value="">Select Time Slot</option>
                        ${generateTimeSlots()}
                    </select>
                    <div class="action-buttons">
                        <button class="approve-btn" onclick="updateAppointment(${apt.id}, 'approved')">
                            Approve
                        </button>
                        <button class="reject-btn" onclick="updateAppointment(${apt.id}, 'rejected')">
                            Reject
                        </button>
                    </div>
                </div>
            ` : ''}
            ${apt.status === 'approved' ? `
                <div class="appointment-actions">
                    <div class="edit-time-section" id="editSection-${apt.id}" style="display: none;">
                        <select class="time-slot-select" id="editTimeSlot-${apt.id}">
                            <option value="">Select New Time Slot</option>
                            ${generateTimeSlots()}
                        </select>
                        <div class="action-buttons">
                            <button class="approve-btn" onclick="saveTimeSlot(${apt.id})">
                                Save
                            </button>
                            <button class="reject-btn" onclick="cancelEdit(${apt.id})">
                                Cancel
                            </button>
                        </div>
                    </div>
                    <div class="action-buttons" id="approvedActions-${apt.id}">
                        <button class="edit-time-btn" id="editBtn-${apt.id}" onclick="showEditTimeSlot(${apt.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Time Slot
                        </button>
                        <button class="delete-btn" onclick="deleteAppointment(${apt.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                        </button>
                    </div>
                </div>
            ` : ''}
            ${apt.status === 'rejected' ? `
                <div class="appointment-actions">
                    <button class="delete-btn" onclick="deleteAppointment(${apt.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    listContainer.innerHTML = html;
}

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

async function updateAppointment(id, status) {
    const timeSlotSelect = document.getElementById(`timeSlot-${id}`);
    const assignedTime = timeSlotSelect ? timeSlotSelect.value : null;

    if (status === 'approved' && !assignedTime) {
        alert('Please select a time slot before approving');
        return;
    }

    try {
        const body = status === 'approved' 
            ? { status, assignedTime } 
            : { status };

        const response = await fetch(`${API_URL}/admin/appointments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show popup notification
            showActionPopup(status);
            
            // Reload appointments after a short delay
            setTimeout(() => {
                loadAppointments(currentStatus);
            }, 500);
        } else {
            alert(data.message || 'Error updating appointment');
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Error updating appointment. Please try again.');
    }
}

function showActionPopup(status) {
    const popup = document.getElementById('actionPopup');
    const popupIcon = document.getElementById('popupIcon');
    const successIcon = document.getElementById('successIcon');
    const rejectIcon = document.getElementById('rejectIcon');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    
    if (status === 'approved') {
        popupIcon.style.background = '#27ae60';
        successIcon.style.display = 'block';
        rejectIcon.style.display = 'none';
        popupTitle.textContent = 'Approved!';
        popupMessage.textContent = 'The appointment has been approved successfully.';
    } else if (status === 'rejected') {
        popupIcon.style.background = '#e74c3c';
        successIcon.style.display = 'none';
        rejectIcon.style.display = 'block';
        popupTitle.textContent = 'Rejected!';
        popupMessage.textContent = 'The appointment has been rejected.';
    } else if (status === 'deleted') {
        popupIcon.style.background = '#e74c3c';
        successIcon.style.display = 'none';
        rejectIcon.style.display = 'block';
        popupTitle.textContent = 'Deleted!';
        popupMessage.textContent = 'The appointment has been deleted.';
    }
    
    popup.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function showEditTimeSlot(id) {
    document.getElementById(`editSection-${id}`).style.display = 'block';
    document.getElementById(`editBtn-${id}`).style.display = 'none';
}

function cancelEdit(id) {
    document.getElementById(`editSection-${id}`).style.display = 'none';
    document.getElementById(`editBtn-${id}`).style.display = 'flex';
    document.getElementById(`editTimeSlot-${id}`).value = '';
}

async function saveTimeSlot(id) {
    const newTimeSlot = document.getElementById(`editTimeSlot-${id}`).value;
    
    if (!newTimeSlot) {
        alert('Please select a new time slot');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/appointments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'approved', assignedTime: newTimeSlot })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Update the displayed time without reloading
            document.getElementById(`assignedTime-${id}`).textContent = newTimeSlot;
            cancelEdit(id);
            
            // Show success popup
            showActionPopup('approved');
        } else {
            alert(data.message || 'Error updating time slot');
        }
    } catch (error) {
        console.error('Error updating time slot:', error);
        alert('Error updating time slot. Please try again.');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/appointments/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show success popup
            showActionPopup('deleted');
            
            // Reload appointments after a short delay
            setTimeout(() => {
                loadAppointments(currentStatus);
            }, 500);
        } else {
            alert(data.message || 'Error deleting appointment');
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Error deleting appointment. Please try again.');
    }
}

// Make functions available globally
window.updateAppointment = updateAppointment;
window.showEditTimeSlot = showEditTimeSlot;
window.cancelEdit = cancelEdit;
window.saveTimeSlot = saveTimeSlot;
window.deleteAppointment = deleteAppointment;
