-- Seed data for Cal.com clone

-- Insert default availability schedule (Mon-Fri, 9am-5pm)
DO $$
DECLARE
    schedule_id_var INTEGER;
BEGIN
    -- Insert or get schedule
    INSERT INTO availability_schedules (name, timezone, is_default) 
    VALUES ('my hours', 'Asia/Kolkata', true)
    ON CONFLICT (name) DO UPDATE SET is_default = EXCLUDED.is_default
    RETURNING id INTO schedule_id_var;
    
    -- If schedule already existed, get its ID
    IF schedule_id_var IS NULL THEN
        SELECT id INTO schedule_id_var FROM availability_schedules WHERE name = 'my hours';
    END IF;
    
    -- Delete existing slots for this schedule to avoid duplicates
    DELETE FROM availability_slots WHERE schedule_id = schedule_id_var;
    
    -- Insert time slots (Mon-Fri, 9am-5pm)
    INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time)
    VALUES 
        (schedule_id_var, 1, '09:00:00', '17:00:00'),  -- Monday
        (schedule_id_var, 2, '09:00:00', '17:00:00'),  -- Tuesday
        (schedule_id_var, 3, '09:00:00', '17:00:00'),  -- Wednesday
        (schedule_id_var, 4, '09:00:00', '17:00:00'),  -- Thursday
        (schedule_id_var, 5, '09:00:00', '17:00:00');  -- Friday
END $$;

-- Insert 2 sample event types
INSERT INTO event_types (title, slug, duration, description, is_visible, location, user_slug) VALUES
    ('15 min meeting', '15min', 15, 'A quick 15-minute video meeting', true, 'Cal Video', 'Surya-dammalapa-vfsnch'),
    ('30 min meeting', '30min', 30, 'A quick video meeting.', true, 'Cal Video', 'Surya-dammalapa-vfsnch')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample bookings
DO $$
DECLARE
    event_type_15_id INTEGER;
    event_type_30_id INTEGER;
    today_date TIMESTAMP WITH TIME ZONE;
    tomorrow_date TIMESTAMP WITH TIME ZONE;
    next_week_date TIMESTAMP WITH TIME ZONE;
    past_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get event type IDs
    SELECT id INTO event_type_15_id FROM event_types WHERE slug = '15min' LIMIT 1;
    SELECT id INTO event_type_30_id FROM event_types WHERE slug = '30min' LIMIT 1;
    
    -- Calculate dates relative to today
    today_date := CURRENT_DATE + INTERVAL '10 hours'; -- 10:00 AM today
    tomorrow_date := CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours'; -- 2:00 PM tomorrow
    next_week_date := CURRENT_DATE + INTERVAL '7 days' + INTERVAL '11 hours'; -- 11:00 AM next week
    past_date := CURRENT_DATE - INTERVAL '3 days' + INTERVAL '15 hours'; -- 3:00 PM 3 days ago
    
    -- Only insert if event types exist and no bookings exist yet
    IF event_type_15_id IS NOT NULL AND event_type_30_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM bookings LIMIT 1) THEN
        -- Upcoming bookings (today, tomorrow, next week)
        INSERT INTO bookings (event_type_id, attendee_name, attendee_email, start_time, end_time, status, notes)
        VALUES
            -- Today's bookings
            (event_type_30_id, 'John Doe', 'john.doe@example.com', today_date, today_date + INTERVAL '30 minutes', 'confirmed', 'Looking forward to our discussion'),
            (event_type_15_id, 'Jane Smith', 'jane.smith@example.com', today_date + INTERVAL '2 hours', today_date + INTERVAL '2 hours 15 minutes', 'confirmed', NULL),
            
            -- Tomorrow's bookings
            (event_type_30_id, 'Bob Johnson', 'bob.johnson@example.com', tomorrow_date, tomorrow_date + INTERVAL '30 minutes', 'confirmed', 'Project review meeting'),
            (event_type_15_id, 'Alice Williams', 'alice.williams@example.com', tomorrow_date + INTERVAL '1 hour', tomorrow_date + INTERVAL '1 hour 15 minutes', 'unconfirmed', NULL),
            
            -- Next week's bookings
            (event_type_30_id, 'Charlie Brown', 'charlie.brown@example.com', next_week_date, next_week_date + INTERVAL '30 minutes', 'confirmed', 'Quarterly planning'),
            (event_type_15_id, 'Diana Prince', 'diana.prince@example.com', next_week_date + INTERVAL '2 hours', next_week_date + INTERVAL '2 hours 15 minutes', 'confirmed', NULL),
            
            -- Past bookings
            (event_type_30_id, 'Emma Watson', 'emma.watson@example.com', past_date, past_date + INTERVAL '30 minutes', 'confirmed', 'Completed successfully'),
            (event_type_15_id, 'Frank Miller', 'frank.miller@example.com', past_date + INTERVAL '1 day', past_date + INTERVAL '1 day' + INTERVAL '15 minutes', 'confirmed', NULL),
            
            -- Canceled booking
            (event_type_30_id, 'Grace Lee', 'grace.lee@example.com', today_date + INTERVAL '4 hours', today_date + INTERVAL '4 hours 30 minutes', 'canceled', 'Rescheduled for next week');
    END IF;
END $$;
