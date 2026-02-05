-- Create appointments table in Supabase
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

-- Create index for faster queries
CREATE INDEX idx_appointments_reference_id ON appointments(reference_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);
