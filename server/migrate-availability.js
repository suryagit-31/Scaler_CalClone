import pool from './db.js';

async function migrateAvailability() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('Starting availability migration...');

    // Check if old availability table has data
    const oldDataResult = await client.query('SELECT COUNT(*) FROM availability');
    const oldCount = parseInt(oldDataResult.rows[0].count);

    if (oldCount === 0) {
      console.log('No existing availability data to migrate.');
      await client.query('COMMIT');
      return;
    }

    console.log(`Found ${oldCount} availability entries to migrate...`);

    // Get all unique schedule names from old table
    const uniqueSchedules = await client.query(`
      SELECT DISTINCT name, is_default 
      FROM availability 
      GROUP BY name, is_default
    `);

    console.log(`Found ${uniqueSchedules.rows.length} unique schedules`);

    // Migrate each schedule
    for (const schedule of uniqueSchedules.rows) {
      // Create schedule in new table
      const scheduleResult = await client.query(
        `INSERT INTO availability_schedules (name, is_default, timezone)
         VALUES ($1, $2, 'Asia/Kolkata')
         ON CONFLICT (name) DO UPDATE SET is_default = EXCLUDED.is_default
         RETURNING id`,
        [schedule.name, schedule.is_default]
      );

      const scheduleId = scheduleResult.rows[0].id;
      console.log(`Created/updated schedule: ${schedule.name} (ID: ${scheduleId})`);

      // Get all slots for this schedule
      const slots = await client.query(
        `SELECT day_of_week, start_time, end_time 
         FROM availability 
         WHERE name = $1`,
        [schedule.name]
      );

      // Delete existing slots for this schedule first
      await client.query(
        'DELETE FROM availability_slots WHERE schedule_id = $1',
        [scheduleId]
      );

      // Insert slots into new table
      for (const slot of slots.rows) {
        await client.query(
          `INSERT INTO availability_slots (schedule_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4)`,
          [scheduleId, slot.day_of_week, slot.start_time, slot.end_time]
        );
      }

      console.log(`  Migrated ${slots.rows.length} time slots`);
    }

    // Ensure only one default schedule
    const defaultSchedules = await client.query(
      `SELECT id FROM availability_schedules WHERE is_default = true ORDER BY id LIMIT 1`
    );

    if (defaultSchedules.rows.length > 0) {
      const firstDefaultId = defaultSchedules.rows[0].id;
      await client.query(
        `UPDATE availability_schedules 
         SET is_default = false 
         WHERE id != $1 AND is_default = true`,
        [firstDefaultId]
      );
      await client.query(
        `UPDATE availability_schedules 
         SET is_default = true 
         WHERE id = $1`,
        [firstDefaultId]
      );
    }

    await client.query('COMMIT');
    console.log('✓ Migration completed successfully!');

    // Verify migration
    const newScheduleCount = await client.query('SELECT COUNT(*) FROM availability_schedules');
    const newSlotCount = await client.query('SELECT COUNT(*) FROM availability_slots');
    
    console.log(`\nMigration Summary:`);
    console.log(`  - Schedules created: ${newScheduleCount.rows[0].count}`);
    console.log(`  - Time slots migrated: ${newSlotCount.rows[0].count}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAvailability()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateAvailability;

