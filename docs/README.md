# Dean Appointment Scheduling System - Backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

Server runs on `http://localhost:5000`

## API Endpoints

### Public Endpoints

**POST /api/appointments**
- Create new appointment
- Body: `{name, role, email, phone, meetingReason, preferredDate}`
- Returns: `{success: true, referenceId: "XXXX"}`

**GET /api/appointments/:referenceId**
- Get appointment by reference ID

**GET /api/appointments/email/:email**
- Get all appointments for an email

### Admin Endpoints

**POST /api/admin/login**
- Body: `{username: "admin", password: "admin123"}`
- Returns: `{success: true, token: "..."}`

**GET /api/admin/appointments?status=pending|approved|rejected|all**
- Get appointments by status

**PUT /api/admin/appointments/:id**
- Update appointment
- Body: `{status: "approved|rejected", assignedTime: "09:00 AM"}`

**GET /api/admin/booked-slots**
- Get all approved appointments with time slots

## Testing

Use curl or Postman to test endpoints:

```bash
# Create appointment
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","role":"Student","email":"john@example.com","phone":"1234567890","meetingReason":"Academic discussion","preferredDate":"2026-02-10"}'

# Check appointment status
curl http://localhost:5000/api/appointments/XXXX

# Admin login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get pending appointments
curl http://localhost:5000/api/admin/appointments?status=pending
```

## Database

SQLite database (`appointments.db`) is created automatically on first run.
