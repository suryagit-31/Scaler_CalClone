import express from 'express';
import pool from '../db.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

// GET available slots for an event type on a specific date
router.get('/', async (req, res) => {
  try {
    const { eventTypeId, date } = req.query;
    
    if (!eventTypeId || !date) {
      return res.status(400).json({ error: 'eventTypeId and date are required' });
    }
    
    // Get event type details
    const eventTypeResult = await pool.query('SELECT * FROM event_types WHERE id = $1', [eventTypeId]);
    if (eventTypeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    const eventType = eventTypeResult.rows[0];
    if (!eventType.is_visible) {
      return res.status(404).json({ error: 'Event type not available' });
    }
    
    // Parse the requested date
    const requestedDate = dayjs(date);
    const dayOfWeek = requestedDate.day(); // 0 = Sunday, 6 = Saturday
    
    // Get availability for this day of week from default schedule
    const availabilityResult = await pool.query(
      `SELECT sl.*, s.timezone
       FROM availability_slots sl
       INNER JOIN availability_schedules s ON sl.schedule_id = s.id
       WHERE sl.day_of_week = $1 AND s.is_default = true
       ORDER BY sl.start_time`,
      [dayOfWeek]
    );
    
    if (availabilityResult.rows.length === 0) {
      return res.json([]); // No availability for this day
    }
    
    // Get existing bookings for this date
    const dayStart = requestedDate.startOf('day').toISOString();
    const dayEnd = requestedDate.endOf('day').toISOString();
    
    const bookingsResult = await pool.query(
      `SELECT start_time, end_time FROM bookings 
       WHERE event_type_id = $1 
       AND status != 'canceled'
       AND start_time >= $2 
       AND start_time < $3`,
      [eventTypeId, dayStart, dayEnd]
    );
    
    const bookedSlots = bookingsResult.rows.map(booking => ({
      start: dayjs(booking.start_time),
      end: dayjs(booking.end_time),
    }));
    
    // Generate available slots
    const availableSlots = [];
    const slotDuration = eventType.duration; // in minutes
    
    for (const avail of availabilityResult.rows) {
      const availStart = dayjs(`${date} ${avail.start_time}`, 'YYYY-MM-DD HH:mm:ss');
      const availEnd = dayjs(`${date} ${avail.end_time}`, 'YYYY-MM-DD HH:mm:ss');
      
      let currentSlot = availStart;
      
      while (true) {
        const slotEnd = currentSlot.add(slotDuration, 'minute');
        
        // Check if slot fits within availability window
        if (slotEnd.isAfter(availEnd)) {
          break;
        }
        
        // Check if this slot conflicts with any booking
        const hasConflict = bookedSlots.some(booked => {
          return (
            (currentSlot.isBefore(booked.end) && slotEnd.isAfter(booked.start))
          );
        });
        
        // Only include slots in the future
        if (!hasConflict && currentSlot.isAfter(dayjs())) {
          availableSlots.push({
            start: currentSlot.toISOString(),
            end: slotEnd.toISOString(),
            formatted: currentSlot.format('h:mm A'),
          });
        }
        
        // Move to next slot (dayjs is immutable, so we need to reassign)
        currentSlot = slotEnd;
        
        // If the next slot would exceed availability, break
        if (currentSlot.add(slotDuration, 'minute').isAfter(availEnd)) {
          break;
        }
      }
    }
    
    // Sort slots by time
    availableSlots.sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));
    
    res.json(availableSlots);
  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
});

export default router;
