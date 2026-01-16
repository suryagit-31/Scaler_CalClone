import express from 'express';
import pool from '../db.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const router = express.Router();

// Helper function to check for overlapping bookings
async function hasOverlappingBooking(eventTypeId, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT id FROM bookings 
    WHERE event_type_id = $1 
    AND status != 'canceled'
    AND (
      (start_time < $2 AND end_time > $2) OR
      (start_time < $3 AND end_time > $3) OR
      (start_time >= $2 AND end_time <= $3)
    )
  `;
  
  const params = [eventTypeId, startTime, endTime];
  
  if (excludeBookingId) {
    query += ' AND id != $4';
    params.push(excludeBookingId);
  }
  
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

// POST create booking
router.post('/', async (req, res) => {
  try {
    const { event_type_id, attendee_name, attendee_email, start_time, end_time, notes } = req.body;
    
    if (!event_type_id || !attendee_name || !attendee_email || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if event type exists
    const eventTypeResult = await pool.query('SELECT * FROM event_types WHERE id = $1', [event_type_id]);
    if (eventTypeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    const eventType = eventTypeResult.rows[0];
    
    // Verify duration matches event type
    const start = dayjs(start_time);
    const end = dayjs(end_time);
    const duration = end.diff(start, 'minute');
    
    if (duration !== eventType.duration) {
      return res.status(400).json({ error: `Duration must be ${eventType.duration} minutes` });
    }
    
    // Check for overlapping bookings
    const hasOverlap = await hasOverlappingBooking(event_type_id, start_time, end_time);
    if (hasOverlap) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }
    
    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (event_type_id, attendee_name, attendee_email, start_time, end_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
       RETURNING *`,
      [event_type_id, attendee_name, attendee_email, start_time, end_time, notes || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET all bookings with filters
router.get('/', async (req, res) => {
  try {
    const { filter, status } = req.query;
    const now = dayjs().toISOString();
    
    let query = `
      SELECT b.*, et.title as event_type_title, et.slug as event_type_slug, et.duration as event_type_duration, et.location as event_type_location
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Apply status filter
    if (status && status !== 'all') {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // Apply time-based filters
    if (filter === 'upcoming') {
      query += ` AND b.start_time >= $${paramIndex} AND b.status != 'canceled'`;
      params.push(now);
      paramIndex++;
    } else if (filter === 'past') {
      query += ` AND b.start_time < $${paramIndex} AND b.status != 'canceled'`;
      params.push(now);
      paramIndex++;
    } else if (filter === 'canceled') {
      query += ` AND b.status = 'canceled'`;
    } else if (filter === 'unconfirmed') {
      query += ` AND b.status = 'unconfirmed'`;
    }
    
    query += ' ORDER BY b.start_time DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PUT update booking (for cancellation)
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE bookings SET status = 'canceled' WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error canceling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;
