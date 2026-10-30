const { initDB, seedSampleData, sqlitePath } = require('../config/db');

console.log('Seeding SQLite database...');
initDB()
  .then(() => seedSampleData())
  .then(() => {
    console.log(`Database successfully seeded at: ${sqlitePath}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
