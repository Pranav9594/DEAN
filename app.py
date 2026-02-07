from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import sqlite3
import secrets
import os

app = Flask(__name__, static_folder='.')
CORS(app)

# Use /tmp directory for database in serverless environment
DB_PATH = '/tmp/appointments.db' if os.environ.get('VERCEL') else 'appointments.db'
_db_initialized = False

def init_db():
    """Initialize database with required schema"""
    global _db_initialized
    if _db_initialized:
        return
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS appointments
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  reference_id TEXT UNIQUE,
                  name TEXT,
                  role TEXT,
                  email TEXT,
                  phone TEXT,
                  meeting_reason TEXT,
                  preferred_date TEXT,
                  status TEXT DEFAULT 'pending',
                  assigned_time TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()
    _db_initialized = True

def get_db():
    """Get database connection with Row factory"""
    # Ensure database is initialized
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return send_from_directory('.', 'request.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    # Validate JSON data
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    # Validate required fields
    required_fields = ['name', 'role', 'email', 'phone', 'meetingReason', 'preferredDate']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate phone number (exactly 10 digits)
    phone = str(data['phone']).strip()
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400
    
    # Validate email format
    email = str(data['email']).strip()
    if '@' not in email or '.' not in email.split('@')[1]:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate date format and ensure it's not in the past
    try:
        preferred_date = datetime.strptime(data['preferredDate'], '%Y-%m-%d').date()
        if preferred_date < datetime.now().date():
            return jsonify({'error': 'Preferred date cannot be in the past'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Generate reference ID with retry logic
    max_retries = 5
    for attempt in range(max_retries):
        reference_id = secrets.token_hex(4).upper()
        
        conn = get_db()
        try:
            c = conn.cursor()
            c.execute('''INSERT INTO appointments (reference_id, name, role, email, phone, meeting_reason, preferred_date)
                         VALUES (?, ?, ?, ?, ?, ?, ?)''',
                      (reference_id, data['name'], data['role'], email, 
                       phone, data['meetingReason'], data['preferredDate']))
            conn.commit()
            return jsonify({'success': True, 'referenceId': reference_id}), 201
        except sqlite3.IntegrityError:
            if attempt < max_retries - 1:
                continue
            return jsonify({'error': 'Failed to generate unique reference ID. Please try again.'}), 500
        finally:
            conn.close()

@app.route('/api/appointments/<reference_id>', methods=['GET'])
def get_appointment(reference_id):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('SELECT * FROM appointments WHERE reference_id = ?', (reference_id,))
        row = c.fetchone()
        
        if not row:
            return jsonify({'error': 'Appointment not found'}), 404
        
        return jsonify(dict(row))
    finally:
        conn.close()

@app.route('/api/appointments/status', methods=['GET'])
def get_appointments_by_phone():
    phone = request.args.get('phone')
    if not phone:
        return jsonify({'error': 'Phone parameter required'}), 400
    
    # Validate phone format
    phone = phone.strip()
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'Invalid phone number format'}), 400
    
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('SELECT * FROM appointments WHERE phone = ? ORDER BY created_at DESC', (phone,))
        rows = c.fetchall()
        return jsonify({'appointments': [dict(row) for row in rows]})
    finally:
        conn.close()

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    if data.get('username') == 'admin' and data.get('password') == 'admin123':
        return jsonify({'success': True, 'token': secrets.token_hex(16)})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/appointments', methods=['GET'])
def get_all_appointments():
    status = request.args.get('status', 'all')
    conn = get_db()
    try:
        c = conn.cursor()
        
        if status == 'all':
            c.execute('SELECT * FROM appointments ORDER BY created_at DESC')
        else:
            c.execute('SELECT * FROM appointments WHERE status = ? ORDER BY created_at DESC', (status,))
        
        rows = c.fetchall()
        return jsonify([dict(row) for row in rows])
    finally:
        conn.close()

@app.route('/api/admin/appointments/<int:id>', methods=['PUT'])
def update_appointment(id):
    data = request.json
    
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    conn = get_db()
    try:
        c = conn.cursor()
        
        if 'status' in data and 'assignedTime' in data:
            # Check for time slot conflicts when approving with assigned time
            if data['status'] == 'approved':
                # Get the preferred date for this appointment
                c.execute('SELECT preferred_date FROM appointments WHERE id = ?', (id,))
                row = c.fetchone()
                if row:
                    preferred_date = row['preferred_date']
                    
                    # Check if this time slot is already taken on this date
                    c.execute('''SELECT id FROM appointments 
                                WHERE preferred_date = ? 
                                AND assigned_time = ? 
                                AND status = 'approved' 
                                AND id != ?''',
                             (preferred_date, data['assignedTime'], id))
                    
                    if c.fetchone():
                        return jsonify({'error': 'This time slot is already booked for the selected date'}), 409
            
            c.execute('UPDATE appointments SET status = ?, assigned_time = ? WHERE id = ?',
                      (data['status'], data['assignedTime'], id))
        elif 'status' in data:
            c.execute('UPDATE appointments SET status = ? WHERE id = ?', (data['status'], id))
        else:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()

@app.route('/api/admin/appointments/<int:id>', methods=['DELETE'])
def delete_appointment(id):
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('DELETE FROM appointments WHERE id = ?', (id,))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()

@app.route('/api/admin/booked-slots', methods=['GET'])
def get_booked_slots():
    conn = get_db()
    try:
        c = conn.cursor()
        c.execute('''SELECT preferred_date, assigned_time FROM appointments 
                     WHERE status = 'approved' AND assigned_time IS NOT NULL
                     ORDER BY preferred_date, assigned_time''')
        rows = c.fetchall()
        return jsonify([dict(row) for row in rows])
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
