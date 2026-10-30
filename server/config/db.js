const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbMode = process.env.DATABASE_MODE || 'sqlite';
let pgPool = null;
let sqliteDb = null;

// Determine SQLite path
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqlitePath = process.env.DB_FILE_PATH || path.join(dbDir, 'lost_and_found.sqlite');

/**
 * Convert parameterized query with ? placeholders to PostgreSQL $1, $2 style
 */
const convertToPgPlaceholders = (sql) => {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
};

/**
 * Initialize connection based on DATABASE_MODE
 */
const connect = () => {
  if (dbMode === 'postgres') {
    const { Pool } = require('pg');
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn('⚠️  DATABASE_MODE is postgres but DATABASE_URL is not provided. Falling back to local SQLite.');
      dbMode = 'sqlite';
    } else {
      try {
        pgPool = new Pool({
          connectionString,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        console.log('✅ Connected to Cloud PostgreSQL database.');
        return;
      } catch (err) {
        console.error('❌ Failed to connect to PostgreSQL. Falling back to local SQLite:', err.message);
        dbMode = 'sqlite';
      }
    }
  }

  // Fallback / default to SQLite
  sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
    if (err) {
      console.error('❌ Error connecting to SQLite database:', err.message);
    } else {
      console.log('✅ Connected to SQLite database at:', sqlitePath);
    }
  });
};

connect();

/**
 * Helper for running mutations (INSERT, UPDATE, DELETE)
 */
const runQuery = (sql, params = []) => {
  if (dbMode === 'postgres' && pgPool) {
    return new Promise((resolve, reject) => {
      const pgSql = convertToPgPlaceholders(sql);
      pgPool.query(pgSql, params, (err, result) => {
        if (err) return reject(err);
        const lastID = result.rows && result.rows[0] ? result.rows[0].id : null;
        resolve({ lastID, changes: result.rowCount });
      });
    });
  }

  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Helper for getting a single record
 */
const getQuery = (sql, params = []) => {
  if (dbMode === 'postgres' && pgPool) {
    return new Promise((resolve, reject) => {
      const pgSql = convertToPgPlaceholders(sql);
      pgPool.query(pgSql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows[0] || null);
      });
    });
  }

  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
};

/**
 * Helper for getting multiple records
 */
const allQuery = (sql, params = []) => {
  if (dbMode === 'postgres' && pgPool) {
    return new Promise((resolve, reject) => {
      const pgSql = convertToPgPlaceholders(sql);
      pgPool.query(pgSql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result.rows || []);
      });
    });
  }

  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

/**
 * Standalone function to seed sample data on demand
 */
const seedSampleData = async () => {
  console.log('Seeding sample lost & found items...');
  const sampleItems = [
    {
      reportId: 'LF-2026-1001',
      title: 'Lost black wallet near the library',
      description: 'Matte black leather bi-fold wallet lost on 2nd floor library study carrels. Contains student ID and transit card.',
      category: 'Bags & Wallets',
      type: 'Lost',
      status: 'Lost',
      location: 'Central Library, 2nd Floor Study Desks',
      date: '2026-10-21',
      image: '',
      contactName: 'Marcus Vance',
      contactEmail: 'marcus.v@student.edu',
      contactPhone: '+1 (555) 234-8901',
      contact: 'marcus.v@student.edu | +1 (555) 234-8901',
      claimantName: null,
      claimantContact: null,
      claimNotes: null,
      userId: 2
    },
    {
      reportId: 'FD-2026-1002',
      title: 'Found blue water bottle in the playground',
      description: 'Royal blue 32oz insulated metal water bottle with campus sports stickers found on bleachers near athletic field.',
      category: 'Accessories',
      type: 'Found',
      status: 'Found',
      location: 'Campus Sports Complex & Playground Bleachers',
      date: '2026-10-22',
      image: '',
      contactName: 'Sports Desk Staff',
      contactEmail: 'rec-desk@campus.edu',
      contactPhone: '+1 (555) 345-6789',
      contact: 'rec-desk@campus.edu | +1 (555) 345-6789',
      claimantName: null,
      claimantContact: null,
      claimNotes: null,
      userId: 1
    },
    {
      reportId: 'LF-2026-1003',
      title: 'Lost student ID card near the computer lab',
      description: 'University RFID student access card with red lanyard lost outside Computer Science Lab 304.',
      category: 'ID Cards',
      type: 'Lost',
      status: 'Claim Pending',
      location: 'Turing Hall Computer Lab 304',
      date: '2026-10-23',
      image: '',
      contactName: 'Priya Sharma',
      contactEmail: 'priya.s@student.edu',
      contactPhone: '+1 (555) 456-7890',
      contact: 'priya.s@student.edu | +1 (555) 456-7890',
      claimantName: 'Lab Assistant Dave',
      claimantContact: 'dave.lab@campus.edu',
      claimNotes: 'Card turned in to lab assistant desk; student notified for pickup.',
      userId: 2
    },
    {
      reportId: 'FD-2026-1004',
      title: 'Found black umbrella in the cafeteria',
      description: 'Automatic compact black umbrella with curved wooden handle left on table 12 in dining hall. Successfully reunited with student!',
      category: 'Accessories',
      type: 'Found',
      status: 'Returned / Recovered',
      location: 'Student Union Cafeteria Table 12',
      date: '2026-10-20',
      image: '',
      contactName: 'Dining Staff Maria',
      contactEmail: 'maria.dining@campus.edu',
      contactPhone: '+1 (555) 567-8901',
      contact: 'maria.dining@campus.edu | +1 (555) 567-8901',
      claimantName: 'Ethan Wright',
      claimantContact: 'ethan.w@student.edu',
      claimNotes: 'Verified ownership and returned in person.',
      userId: 1
    },
    {
      reportId: 'LF-2026-1005',
      title: 'Lost wireless earbuds in a classroom',
      description: 'White wireless earbuds in charging case with neon green silicone protective sleeve. Left during Economics 101 lecture.',
      category: 'Electronics',
      type: 'Lost',
      status: 'Lost',
      location: 'Humanities Hall Lecture Room 102',
      date: '2026-10-23',
      image: '',
      contactName: 'Jordan Reed',
      contactEmail: 'jordan.r@student.edu',
      contactPhone: '+1 (555) 678-9012',
      contact: 'jordan.r@student.edu | +1 (555) 678-9012',
      claimantName: null,
      claimantContact: null,
      claimNotes: null,
      userId: 2
    },
    {
      reportId: 'FD-2026-1006',
      title: 'Found a notebook near the auditorium',
      description: 'Dark green 5-subject spiral notebook with handwritten Organic Chemistry notes on front inside cover.',
      category: 'Books',
      type: 'Found',
      status: 'Found',
      location: 'Main Campus Auditorium Foyer North',
      date: '2026-10-22',
      image: '',
      contactName: 'Campus Events Team',
      contactEmail: 'events@campus.edu',
      contactPhone: '+1 (555) 789-0123',
      contact: 'events@campus.edu | +1 (555) 789-0123',
      claimantName: null,
      claimantContact: null,
      claimNotes: null,
      userId: 1
    },
    {
      reportId: 'LF-2026-1007',
      title: 'Lost a set of keys near the parking area',
      description: 'Set of 3 silver house keys and black car key fob attached to blue woven paracord lanyard.',
      category: 'Keys',
      type: 'Lost',
      status: 'Lost',
      location: 'Student Parking Lot C, Near Gate 4',
      date: '2026-10-24',
      image: '',
      contactName: 'Tyler Kim',
      contactEmail: 'tyler.k@student.edu',
      contactPhone: '+1 (555) 890-1234',
      contact: 'tyler.k@student.edu | +1 (555) 890-1234',
      claimantName: null,
      claimantContact: null,
      claimNotes: null,
      userId: 2
    },
    {
      reportId: 'FD-2026-1008',
      title: 'Found a backpack in the college library',
      description: 'Grey North Face backpack found near 3rd floor periodicals section. Safely stored at library circulation desk.',
      category: 'Bags & Wallets',
      type: 'Found',
      status: 'Claim Pending',
      location: 'Central Library, 3rd Floor Circulation Desk',
      date: '2026-10-23',
      image: '',
      contactName: 'Library Circulation Desk',
      contactEmail: 'library-circ@campus.edu',
      contactPhone: '+1 (555) 901-2345',
      contact: 'library-circ@campus.edu | +1 (555) 901-2345',
      claimantName: 'Samantha Lee',
      claimantContact: 'samantha.l@student.edu',
      claimNotes: 'Claim initiated; waiting for student verification at desk.',
      userId: 1
    }
  ];

  for (const item of sampleItems) {
    await runQuery(
      `INSERT INTO items (
        reportId, title, description, category, type, status, location, date,
        image, contactName, contactEmail, contactPhone, contact,
        claimantName, claimantContact, claimNotes, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.reportId, item.title, item.description, item.category, item.type, item.status, item.location, item.date,
        item.image, item.contactName, item.contactEmail, item.contactPhone, item.contact,
        item.claimantName, item.claimantContact, item.claimNotes, item.userId
      ]
    );
  }
  console.log('✅ Seeded sample lost & found items.');
};

/**
 * Clear all item and claim data from the database
 */
const clearAllData = async () => {
  await runQuery(`DELETE FROM claims`);
  await runQuery(`DELETE FROM items`);
  try {
    await runQuery(`DELETE FROM sqlite_sequence WHERE name IN ('items', 'claims')`);
  } catch (e) {
    // sqlite_sequence may not exist in postgres
  }
  console.log('🧹 Cleared all items and claims from database.');
};

/**
 * Initialize Database Schema
 */
const initDB = async () => {
  try {
    const isPostgres = dbMode === 'postgres' && pgPool;

    // 1. Users table
    if (isPostgres) {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'student',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'student',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 2. Items table
    if (isPostgres) {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          reportId VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          type VARCHAR(20) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Lost',
          location VARCHAR(255) NOT NULL,
          date VARCHAR(50) NOT NULL,
          image TEXT DEFAULT '',
          contactName VARCHAR(255) NOT NULL,
          contactEmail VARCHAR(255),
          contactPhone VARCHAR(100),
          contact VARCHAR(255) NOT NULL,
          claimantName VARCHAR(255),
          claimantContact VARCHAR(255),
          claimNotes TEXT,
          userId INTEGER,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reportId TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Lost',
          location TEXT NOT NULL,
          date TEXT NOT NULL,
          image TEXT DEFAULT '',
          contactName TEXT NOT NULL,
          contactEmail TEXT,
          contactPhone TEXT,
          contact TEXT NOT NULL,
          claimantName TEXT,
          claimantContact TEXT,
          claimNotes TEXT,
          userId INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // 3. Claims table
    if (isPostgres) {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS claims (
          id SERIAL PRIMARY KEY,
          itemId INTEGER NOT NULL,
          claimantName VARCHAR(255) NOT NULL,
          claimantContact VARCHAR(255) NOT NULL,
          claimNotes TEXT,
          status VARCHAR(50) DEFAULT 'Pending',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await runQuery(`
        CREATE TABLE IF NOT EXISTS claims (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          itemId INTEGER NOT NULL,
          claimantName TEXT NOT NULL,
          claimantContact TEXT NOT NULL,
          claimNotes TEXT,
          status TEXT DEFAULT 'Pending',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Seed default admin and student users for authentication
    const adminExists = await getQuery(`SELECT * FROM users WHERE email = ?`, ['admin@campus.edu']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await runQuery(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Campus Admin', 'admin@campus.edu', hashedPassword, 'admin']
      );
    }

    const studentExists = await getQuery(`SELECT * FROM users WHERE email = ?`, ['alex@student.edu']);
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      await runQuery(
        `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Alex Johnson', 'alex@student.edu', hashedPassword, 'student']
      );
    }

    // Only seed sample items if explicitly requested via environment variable
    if (process.env.SEED_SAMPLE_DATA === 'true') {
      const itemCounts = await getQuery(`SELECT COUNT(*) as count FROM items`);
      const count = parseInt(itemCounts.count || itemCounts.COUNT || 0, 10);
      if (count === 0) {
        await seedSampleData();
      }
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  dbMode,
  sqlitePath,
  runQuery,
  getQuery,
  allQuery,
  initDB,
  seedSampleData,
  clearAllData,
  getDBMode: () => dbMode
};
