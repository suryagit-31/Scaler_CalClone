import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all event types
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM event_types ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

// GET event type by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM event_types WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event type:', error);
    res.status(500).json({ error: 'Failed to fetch event type' });
  }
});

// GET event type by slug (for public booking)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM event_types WHERE slug = $1 AND is_visible = true', [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching event type by slug:', error);
    res.status(500).json({ error: 'Failed to fetch event type' });
  }
});

// POST create event type
router.post('/', async (req, res) => {
  try {
    const { title, slug, duration, description, is_visible, location, allow_multiple_durations, user_slug } = req.body;
    
    console.log('Received event type data:', { title, slug, duration, description, is_visible, location, allow_multiple_durations, user_slug });
    
    if (!title || !slug || !duration) {
      return res.status(400).json({ error: 'Title, slug, and duration are required' });
    }
    
    // Validate slug is not empty
    if (!slug.trim()) {
      return res.status(400).json({ error: 'Slug cannot be empty' });
    }
    
    const result = await pool.query(
      `INSERT INTO event_types (title, slug, duration, description, is_visible, location, allow_multiple_durations, user_slug, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, slug.trim(), parseInt(duration), description || null, is_visible !== false, location || 'Cal Video', allow_multiple_durations || false, user_slug || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Slug already exists' });
    }
    console.error('Error creating event type:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to create event type',
      details: error.message,
      code: error.code
    });
  }
});

// PUT update event type
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, duration, description, is_visible, location, allow_multiple_durations, user_slug } = req.body;
    
    console.log('Received update event type data:', { id, title, slug, duration, description, is_visible, location, allow_multiple_durations, user_slug });
    
    if (!title || !slug || duration === undefined || duration === null) {
      return res.status(400).json({ error: 'Title, slug, and duration are required' });
    }
    
    // Validate slug is not empty
    if (!slug.trim()) {
      return res.status(400).json({ error: 'Slug cannot be empty' });
    }
    
    // Validate and parse duration
    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt < 1) {
      return res.status(400).json({ error: 'Duration must be a positive number' });
    }
    
    const result = await pool.query(
      `UPDATE event_types 
       SET title = $1,
           slug = $2,
           duration = $3,
           description = $4,
           is_visible = $5,
           location = $6,
           allow_multiple_durations = $7,
           user_slug = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, slug.trim(), durationInt, description || null, is_visible !== false, location || 'Cal Video', allow_multiple_durations || false, user_slug || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Slug already exists', details: error.detail });
    }
    console.error('Error updating event type:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to update event type',
      details: error.message,
      code: error.code
    });
  }
});

// DELETE event type
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM event_types WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.json({ message: 'Event type deleted successfully' });
  } catch (error) {
    console.error('Error deleting event type:', error);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
});

export default router;
