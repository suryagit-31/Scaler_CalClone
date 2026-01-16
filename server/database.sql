-- Database schema for Cal.com clone

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    duration INTEGER NOT NULL,
    description TEXT,
    is_visible BOOLEAN DEFAULT true,
    location VARCHAR(255) DEFAULT 'Cal Video',
    allow_multiple_durations BOOLEAN DEFAULT false,
    user_slug VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create availability_schedules table (one row per schedule)
CREATE TABLE IF NOT EXISTS availability_schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create availability_slots table (multiple rows per schedule)
CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER NOT NULL REFERENCES availability_schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Old availability table removed - now using availability_schedules and availability_slots

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_type_id INTEGER NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'unconfirmed', 'canceled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_types_slug ON event_types(slug);
CREATE INDEX IF NOT EXISTS idx_event_types_user_slug ON event_types(user_slug);
CREATE INDEX IF NOT EXISTS idx_availability_slots_schedule_id ON availability_slots(schedule_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_schedules_default ON availability_schedules(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_bookings_event_type_id ON bookings(event_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
