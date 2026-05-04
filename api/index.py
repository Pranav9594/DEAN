from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from supabase import create_client
from datetime import datetime
from functools import wraps
import secrets
import os
import time

app = Flask(__name__, static_folder='..')
CORS(app)

supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_KEY'))

# In-memory token store and login rate limiter
valid_tokens = set()
_login_attempts = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 300

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token or token not in valid_tokens:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def index():
    return send_from_directory('..', 'request.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('..', path)

@app.route('/api/appointments', methods=['POST'])
def create_appointment():
    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    for field in ['name', 'role', 'email', 'phone', 'meetingReason', 'preferredDate']:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    phone = str(data['phone']).strip()
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'Phone number must be exactly 10 digits'}), 400

    email = str(data['email']).strip()
    if '@' not in email or '.' not in email.split('@')[1]:
        return jsonify({'error': 'Invalid email format'}), 400

    try:
        preferred_date = datetime.fromisoformat(data['preferredDate']).date()
        if preferred_date < datetime.now().date():
            return jsonify({'error': 'Preferred date cannot be in the past'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    for _ in range(5):
        reference_id = secrets.token_hex(4).upper()
        existing = supabase.table('appointments').select('id').eq('reference_id', reference_id).execute()
        if not existing.data:
            supabase.table('appointments').insert({
                'reference_id': reference_id,
                'name': data['name'],
                'role': data['role'],
                'email': email,
                'phone': phone,
                'meeting_reason': data['meetingReason'],
                'preferred_date': data['preferredDate'],
                'status': 'pending'
            }).execute()
            return jsonify({'success': True, 'referenceId': reference_id}), 201

    return jsonify({'error': 'Failed to generate unique reference ID. Please try again.'}), 500

@app.route('/api/appointments/status', methods=['GET'])
def get_appointments_by_phone():
    phone = request.args.get('phone', '').strip()
    if not phone.isdigit() or len(phone) != 10:
        return jsonify({'error': 'Invalid phone number format'}), 400
    result = supabase.table('appointments').select('*').eq('phone', phone).order('created_at', desc=True).execute()
    return jsonify({'appointments': result.data})

@app.route('/api/appointments/<reference_id>', methods=['GET'])
def get_appointment(reference_id):
    result = supabase.table('appointments').select('*').eq('reference_id', reference_id).execute()
    if not result.data:
        return jsonify({'error': 'Appointment not found'}), 404
    return jsonify(result.data[0])

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    ip = request.remote_addr
    now = time.time()
    attempts = _login_attempts.get(ip, {'count': 0, 'since': now})

    if attempts['count'] >= MAX_LOGIN_ATTEMPTS and now - attempts['since'] < LOCKOUT_SECONDS:
        return jsonify({'error': 'Too many login attempts. Try again later.'}), 429

    if now - attempts['since'] >= LOCKOUT_SECONDS:
        attempts = {'count': 0, 'since': now}

    data = request.json
    admin_user = os.environ.get('ADMIN_USER', 'admin')
    admin_pass = os.environ.get('ADMIN_PASS', 'admin123')

    if data.get('username') == admin_user and data.get('password') == admin_pass:
        _login_attempts.pop(ip, None)
        token = secrets.token_hex(32)
        valid_tokens.add(token)
        return jsonify({'success': True, 'token': token})

    attempts['count'] += 1
    _login_attempts[ip] = attempts
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin/appointments', methods=['GET'])
@require_auth
def get_all_appointments():
    status = request.args.get('status', 'all')
    if status == 'all':
        result = supabase.table('appointments').select('*').order('created_at', desc=True).execute()
    else:
        result = supabase.table('appointments').select('*').eq('status', status).order('created_at', desc=True).execute()
    return jsonify(result.data)

@app.route('/api/admin/appointments/<int:apt_id>', methods=['PUT'])
@require_auth
def update_appointment(apt_id):
    data = request.json
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400

    update_data = {}
    if 'status' in data:
        update_data['status'] = data['status']
    if 'assignedTime' in data:
        update_data['assigned_time'] = data['assignedTime']

    if not update_data:
        return jsonify({'error': 'Missing required fields'}), 400

    if data.get('status') == 'approved' and 'assignedTime' in data:
        apt = supabase.table('appointments').select('preferred_date').eq('id', apt_id).execute()
        if apt.data:
            conflict = supabase.table('appointments').select('id') \
                .eq('preferred_date', apt.data[0]['preferred_date']) \
                .eq('assigned_time', data['assignedTime']) \
                .eq('status', 'approved') \
                .neq('id', apt_id).execute()
            if conflict.data:
                return jsonify({'error': 'This time slot is already booked for the selected date'}), 409

    supabase.table('appointments').update(update_data).eq('id', apt_id).execute()
    return jsonify({'success': True})

@app.route('/api/admin/appointments/<int:apt_id>', methods=['DELETE'])
@require_auth
def delete_appointment(apt_id):
    supabase.table('appointments').delete().eq('id', apt_id).execute()
    return jsonify({'success': True})

@app.route('/api/admin/booked-slots', methods=['GET'])
@require_auth
def get_booked_slots():
    result = supabase.table('appointments').select('preferred_date, assigned_time') \
        .eq('status', 'approved').not_.is_('assigned_time', 'null') \
        .order('preferred_date').order('assigned_time').execute()
    return jsonify(result.data)
