// Migration script to add awards column to people table
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/database/movienizer.db');
const db = new Database(dbPath);

try {
  // Check if awards column exists
  const tableInfo = db.prepare("PRAGMA table_info(people)").all();
  const hasAwardsColumn = tableInfo.some(col => col.name === 'awards');
  
  if (!hasAwardsColumn) {
    console.log('Adding awards column to people table...');
    db.exec('ALTER TABLE people ADD COLUMN awards TEXT');
    console.log('Awards column added successfully!');
  } else {
    console.log('Awards column already exists.');
  }
} catch (error) {
  console.error('Error during migration:', error.message);
  process.exit(1);
} finally {
  db.close();
}
