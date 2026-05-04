# 📅 Dean Appointment Scheduling System

A modern, mobile-optimized web application for scheduling appointments with the Dean's Office. Built with Flask backend, vanilla JavaScript frontend, and Supabase database.

## ✨ Features

### 👥 User Features
- **Request Appointments** - Submit appointment requests with personal details
- **Check Status** - Track appointment status using phone number
- **Role Selection** - Student, Parent, Visitor, Staff, or Other
- **Date Selection** - Choose preferred appointment dates
- **Real-time Updates** - Instant feedback on requests
- **Mobile Optimized** - Fast, responsive design for all devices

### 🔐 Admin Features
- **Secure Login** - Password-protected admin dashboard
- **Appointment Management** - Approve or reject requests
- **Time Slot Assignment** - Assign specific meeting times (9 AM - 4:30 PM)
- **Status Filtering** - View pending, approved, or rejected appointments
- **Conflict Prevention** - Automatic time slot conflict detection

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design for mobile and desktop
- Dark theme UI

**Backend:**
- Python Flask
- RESTful API architecture
- Supabase (PostgreSQL) database

**Deployment:**
- Vercel (Serverless functions)
- GitHub for version control

## 📁 Project Structure

```
project/
├── api/                  # Vercel serverless functions
│   └── index.py         # API endpoints with Supabase
├── css/                  # Stylesheets
│   ├── admin-style.css
│   ├── request-style.css
│   ├── status-style.css
│   └── style.css
├── js/                   # JavaScript files
│   ├── admin-script.js
│   ├── request-script.js
│   └── status-script.js
├── admin.html           # Admin dashboard
├── index.html           # Home/More page
├── request.html         # Appointment request form
├── status.html          # Status checker
├── app.py              # Local Flask development server
└── requirements.txt    # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Supabase account
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Pranav9594/DEAN.git
cd DEAN
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password
```

4. **Run the application**
```bash
python app.py
```

5. **Open browser**
```
http://localhost:5000
```

## 🗄️ Database Setup

### Supabase Schema

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    reference_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    meeting_reason TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    assigned_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_reference_id ON appointments(reference_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);
```

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **Connect to Vercel**
- Go to [Vercel](https://vercel.com)
- Import your GitHub repository
- Add environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `ADMIN_USER`
  - `ADMIN_PASS`

3. **Deploy**
- Vercel auto-deploys on push

## 📡 API Endpoints

### Public Endpoints

**POST** `/api/appointments`
- Create new appointment
- Body: `{name, role, email, phone, meetingReason, preferredDate}`
- Returns: `{success: true, referenceId: "phone_number"}`

**GET** `/api/appointments/status?phone=:phone`
- Get appointment by phone number

### Admin Endpoints

**POST** `/api/admin/login`
- Admin login
- Body: `{username: "<ADMIN_USER>", password: "<ADMIN_PASS>"}`
- Returns: `{success: true, token: "..."`}

**GET** `/api/admin/appointments?status=pending|approved|rejected`
- Get appointments by status

**PUT** `/api/admin/appointments/:id`
- Update appointment
- Body: `{status: "approved|rejected", assignedTime: "09:00 AM"}`

**DELETE** `/api/admin/appointments/:id`
- Delete appointment

**GET** `/api/admin/booked-slots`
- Get all approved appointments with time slots
  
## 📱 Pages

1. **Home (More)** - Information and contact details
2. **Request** - Appointment request form
3. **Status** - Check appointment status
4. **Admin** - Admin dashboard (protected)

## 🎨 Features Highlight

- **Dark Theme** - Modern black UI with blue accents
- **Animated Icons** - SVG animations for better UX
- **Form Validation** - Client-side validation
- **Mobile Optimized** - Fast, responsive design for all devices
- **Bottom Navigation** - Easy mobile navigation
- **Success Popups** - User-friendly feedback
- **Touch Friendly** - Optimized for mobile interactions

Made with ❤️ for Dean's Office Appointment Management.
