from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import secrets
import os

app = Flask(__name__)
CORS(app)

DB_PATH = '/tmp/appointments.db'

def init_db():
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

def get_db():
    if not os.path.exists(DB_PATH):
        init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO appointments (reference_id, name, role, email, phone, meeting_reason, preferred_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (data['phone'], data['name'], data['role'], data['email'], 
               data['phone'], data['meetingReason'], data['preferredDate']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'referenceId': data['phone']}), 201

@app.route('/api/appointments/<reference_id>', methods=['GET'])
def get_appointment(reference_id):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM appointments WHERE reference_id = ?', (reference_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Appointment not found'}), 404
    
    return jsonify(dict(row))

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
    c = conn.cursor()
    
    if status == 'all':
        c.execute('SELECT * FROM appointments ORDER BY created_at DESC')
    else:
        c.execute('SELECT * FROM appointments WHERE status = ? ORDER BY created_at DESC', (status,))
    
    rows = c.fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in rows])

@app.route('/api/admin/appointments/<int:id>', methods=['PUT'])
def update_appointment(id):
    data = request.json
    conn = get_db()
    c = conn.cursor()
    
    if 'status' in data and 'assignedTime' in data:
        c.execute('UPDATE appointments SET status = ?, assigned_time = ? WHERE id = ?',
                  (data['status'], data['assignedTime'], id))
    elif 'status' in data:
        c.execute('UPDATE appointments SET status = ? WHERE id = ?', (data['status'], id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/admin/booked-slots', methods=['GET'])
def get_booked_slots():
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT preferred_date, assigned_time FROM appointments 
                 WHERE status = 'approved' AND assigned_time IS NOT NULL
                 ORDER BY preferred_date, assigned_time''')
    rows = c.fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in rows])
