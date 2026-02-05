import json
import os
from supabase import create_client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def handler(event, context):
    path = event.get('path', '').replace('/.netlify/functions/api', '')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    
    try:
        if path == '/appointments' and method == 'POST':
            result = supabase.table('appointments').insert({
                'reference_id': body['phone'],
                'name': body['name'],
                'role': body['role'],
                'email': body['email'],
                'phone': body['phone'],
                'meeting_reason': body['meetingReason'],
                'preferred_date': body['preferredDate'],
                'status': 'pending'
            }).execute()
            return {'statusCode': 201, 'body': json.dumps({'success': True, 'referenceId': body['phone']})}
        
        elif path.startswith('/appointments/') and method == 'GET':
            ref_id = path.split('/')[-1]
            result = supabase.table('appointments').select('*').eq('reference_id', ref_id).execute()
            if not result.data:
                return {'statusCode': 404, 'body': json.dumps({'error': 'Appointment not found'})}
            return {'statusCode': 200, 'body': json.dumps(result.data[0])}
        
        elif path == '/admin/login' and method == 'POST':
            if body.get('username') == 'admin' and body.get('password') == 'admin123':
                import secrets
                return {'statusCode': 200, 'body': json.dumps({'success': True, 'token': secrets.token_hex(16)})}
            return {'statusCode': 401, 'body': json.dumps({'error': 'Invalid credentials'})}
        
        elif path == '/admin/appointments' and method == 'GET':
            status = event.get('queryStringParameters', {}).get('status', 'all')
            if status == 'all':
                result = supabase.table('appointments').select('*').order('created_at', desc=True).execute()
            else:
                result = supabase.table('appointments').select('*').eq('status', status).order('created_at', desc=True).execute()
            return {'statusCode': 200, 'body': json.dumps(result.data)}
        
        elif path.startswith('/admin/appointments/') and method == 'PUT':
            apt_id = int(path.split('/')[-1])
            update_data = {}
            if 'status' in body:
                update_data['status'] = body['status']
            if 'assignedTime' in body:
                update_data['assigned_time'] = body['assignedTime']
            result = supabase.table('appointments').update(update_data).eq('id', apt_id).execute()
            return {'statusCode': 200, 'body': json.dumps({'success': True})}
        
        elif path == '/admin/booked-slots' and method == 'GET':
            result = supabase.table('appointments').select('preferred_date, assigned_time').eq('status', 'approved').not_.is_('assigned_time', 'null').order('preferred_date').order('assigned_time').execute()
            return {'statusCode': 200, 'body': json.dumps(result.data)}
        
        return {'statusCode': 404, 'body': json.dumps({'error': 'Not found'})}
    
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
