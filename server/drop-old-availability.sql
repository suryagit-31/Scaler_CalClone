-- Script to drop the old availability table
-- Run this if you want to manually remove the old table

DROP TABLE IF EXISTS availability CASCADE;

-- Verify it's gone
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'availability')
        THEN 'Table still exists'
        ELSE 'Table successfully dropped'
    END AS status;

