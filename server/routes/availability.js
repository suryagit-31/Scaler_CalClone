import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all availability (returns in format compatible with frontend)
router.get('/', async (req, res) => {
  try {
    // Get all schedules with their slots
    const result = await pool.query(`
      SELECT 
        s.id as schedule_id,
        s.name,
        s.timezone,
        s.is_default,
        s.created_at,
        s.updated_at,
        sl.id as slot_id,
        sl.day_of_week,
        sl.start_time,
        sl.end_time
      FROM availability_schedules s
      LEFT JOIN availability_slots sl ON s.id = sl.schedule_id
      ORDER BY s.name, sl.day_of_week, sl.start_time
    `);

    // Transform to flat structure for backward compatibility
    const availability = result.rows.map(row => ({
      id: row.slot_id || row.schedule_id,
      schedule_id: row.schedule_id,
      name: row.name,
      timezone: row.timezone,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      is_default: row.is_default,
      created_at: row.created_at
    })).filter(row => row.day_of_week !== null); // Filter out schedules with no slots

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// GET a specific schedule by ID
router.get('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const scheduleResult = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = $1',
      [id]
    );

    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const slotsResult = await pool.query(
      'SELECT * FROM availability_slots WHERE schedule_id = $1 ORDER BY day_of_week, start_time',
      [id]
    );

    res.json({
      ...scheduleResult.rows[0],
      slots: slotsResult.rows
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// POST create a new schedule
router.post('/schedules', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, timezone, is_default, slots } = req.body;
    
    if (!name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Schedule name is required' });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await client.query(
        'UPDATE availability_schedules SET is_default = false WHERE is_default = true'
      );
    }

    // Create schedule
    const scheduleResult = await client.query(
      `INSERT INTO availability_schedules (name, timezone, is_default)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, timezone || 'Asia/Kolkata', is_default || false]
    );

    const scheduleId = scheduleResult.rows[0].id;

    // Insert slots
    if (slots && Array.isArray(slots)) {
      for (const slot of slots) {
        const { day_of_week, start_time, end_time } = slot;
        
        if (day_of_week !== undefined && start_time && end_time) {
          await client.query(
            `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time)
             VALUES ($1, $2, $3, $4)`,
            [scheduleId, day_of_week, start_time, end_time]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Fetch and return the created schedule with slots
    const schedule = await client.query(
      'SELECT * FROM availability_schedules WHERE id = $1',
      [scheduleId]
    );
    const scheduleSlots = await client.query(
      'SELECT * FROM availability_slots WHERE schedule_id = $1 ORDER BY day_of_week, start_time',
      [scheduleId]
    );

    res.status(201).json({
      ...schedule.rows[0],
      slots: scheduleSlots.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating schedule:', error);
    
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'A schedule with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  } finally {
    client.release();
  }
});

// PUT update availability (bulk update - for backward compatibility)
router.put('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { availability } = req.body;
    
    if (!Array.isArray(availability)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Availability must be an array' });
    }

    // Group by schedule name
    const schedulesMap = new Map();
    
    for (const avail of availability) {
      const { name, day_of_week, start_time, end_time, is_default } = avail;
      
      if (!name || day_of_week === undefined || !start_time || !end_time) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each availability entry must have name, day_of_week, start_time, and end_time' });
      }

      if (!schedulesMap.has(name)) {
        schedulesMap.set(name, {
          name,
          is_default: is_default || false,
          slots: []
        });
      }

      schedulesMap.get(name).slots.push({
        day_of_week,
        start_time,
        end_time
      });
    }

    // Delete all existing schedules and slots
    await client.query('DELETE FROM availability_slots');
    await client.query('DELETE FROM availability_schedules');

    // Determine which schedule should be default (first one with is_default=true, or first one)
    let defaultScheduleName = null;
    for (const [name, schedule] of schedulesMap) {
      if (schedule.is_default) {
        defaultScheduleName = name;
        break;
      }
    }
    if (!defaultScheduleName && schedulesMap.size > 0) {
      defaultScheduleName = Array.from(schedulesMap.keys())[0];
    }

    // Create schedules and slots
    for (const [name, schedule] of schedulesMap) {
      const isDefault = name === defaultScheduleName;

      const scheduleResult = await client.query(
        `INSERT INTO availability_schedules (name, timezone, is_default)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, 'Asia/Kolkata', isDefault]
      );

      const scheduleId = scheduleResult.rows[0].id;

      for (const slot of schedule.slots) {
        await client.query(
          `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)`,
          [scheduleId, slot.day_of_week, slot.start_time, slot.end_time]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch and return updated availability in old format
    const result = await pool.query(`
      SELECT 
        s.name,
        s.is_default,
        sl.day_of_week,
        sl.start_time,
        sl.end_time,
        sl.id,
        s.created_at
      FROM availability_schedules s
      INNER JOIN availability_slots sl ON s.id = sl.schedule_id
      ORDER BY s.name, sl.day_of_week, sl.start_time
    `);

    const formatted = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      is_default: row.is_default,
      created_at: row.created_at
    }));

    res.json(formatted);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  } finally {
    client.release();
  }
});

// PUT update a specific schedule
router.put('/schedules/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, timezone, is_default, slots } = req.body;

    // Check if schedule exists
    const existingSchedule = await client.query(
      'SELECT * FROM availability_schedules WHERE id = $1',
      [id]
    );

    if (existingSchedule.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await client.query(
        'UPDATE availability_schedules SET is_default = false WHERE id != $1 AND is_default = true',
        [id]
      );
    }

    // Update schedule
    if (name !== undefined || timezone !== undefined || is_default !== undefined) {
      await client.query(
        `UPDATE availability_schedules 
         SET name = COALESCE($1, name),
             timezone = COALESCE($2, timezone),
             is_default = COALESCE($3, is_default),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [name, timezone, is_default, id]
      );
    }

    // Update slots if provided
    if (slots && Array.isArray(slots)) {
      // Get existing slots
      const existingSlotsResult = await client.query(
        'SELECT * FROM availability_slots WHERE schedule_id = $1 ORDER BY day_of_week, start_time',
        [id]
      );
      const existingSlots = existingSlotsResult.rows;

      // Create a map for quick lookup: key = "day-start-end", value = slot
      const existingSlotsMap = new Map();
      existingSlots.forEach(slot => {
        const key = `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`;
        existingSlotsMap.set(key, slot);
      });

      // Track which existing slot IDs we've matched/used
      const usedSlotIds = new Set();
      const slotsToInsert = [];

      // First pass: Match exact slots (same day, start_time, end_time)
      for (const slot of slots) {
        const { day_of_week, start_time, end_time } = slot;
        
        if (day_of_week !== undefined && start_time && end_time) {
          const key = `${day_of_week}-${start_time}-${end_time}`;
          const existingSlot = existingSlotsMap.get(key);

          if (existingSlot && !usedSlotIds.has(existingSlot.id)) {
            // Exact match - preserve the ID (no update needed)
            usedSlotIds.add(existingSlot.id);
          } else {
            // No exact match - will need to insert or update
            slotsToInsert.push({ day_of_week, start_time, end_time });
          }
        }
      }

      // Second pass: For unmatched incoming slots, try to match by position within day
      // Group unmatched incoming slots by day
      const incomingByDay = new Map();
      slotsToInsert.forEach(slot => {
        if (!incomingByDay.has(slot.day_of_week)) {
          incomingByDay.set(slot.day_of_week, []);
        }
        incomingByDay.get(slot.day_of_week).push(slot);
      });

      // Group unused existing slots by day
      const existingByDay = new Map();
      existingSlots.forEach(slot => {
        if (!usedSlotIds.has(slot.id)) {
          if (!existingByDay.has(slot.day_of_week)) {
            existingByDay.set(slot.day_of_week, []);
          }
          existingByDay.get(slot.day_of_week).push(slot);
        }
      });

      const remainingSlotsToInsert = [];
      
      // For each day with unmatched incoming slots
      for (const [dayOfWeek, incomingDaySlots] of incomingByDay) {
        const existingDaySlots = existingByDay.get(dayOfWeek) || [];
        
        // Sort both by start_time for position matching
        incomingDaySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
        existingDaySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));

        // Match by position: first incoming matches first existing, etc.
        for (let i = 0; i < incomingDaySlots.length; i++) {
          const incomingSlot = incomingDaySlots[i];
          const existingSlot = existingDaySlots[i];

          if (existingSlot) {
            // Update existing slot at this position
            await client.query(
              `UPDATE availability_slots 
               SET start_time = $1, end_time = $2
               WHERE id = $3`,
              [incomingSlot.start_time, incomingSlot.end_time, existingSlot.id]
            );
            usedSlotIds.add(existingSlot.id);
          } else {
            // No existing slot at this position - insert new
            remainingSlotsToInsert.push(incomingSlot);
          }
        }
      }

      // Third pass: Insert remaining new slots
      for (const slot of remainingSlotsToInsert) {
        await client.query(
          `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)`,
          [id, slot.day_of_week, slot.start_time, slot.end_time]
        );
      }

      // Delete slots that are no longer needed
      const slotsToDelete = existingSlots.filter(slot => !usedSlotIds.has(slot.id));
      if (slotsToDelete.length > 0) {
        const idsToDelete = slotsToDelete.map(s => s.id);
        await client.query(
          `DELETE FROM availability_slots WHERE id = ANY($1::int[])`,
          [idsToDelete]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch and return updated schedule
    const schedule = await client.query(
      'SELECT * FROM availability_schedules WHERE id = $1',
      [id]
    );
    const scheduleSlots = await client.query(
      'SELECT * FROM availability_slots WHERE schedule_id = $1 ORDER BY day_of_week, start_time',
      [id]
    );

    res.json({
      ...schedule.rows[0],
      slots: scheduleSlots.rows
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  } finally {
    client.release();
  }
});

// DELETE a schedule
router.delete('/schedules/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    const result = await client.query(
      'DELETE FROM availability_schedules WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Schedule not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  } finally {
    client.release();
  }
});

export default router;
