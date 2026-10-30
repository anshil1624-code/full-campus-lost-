const { clearAllData, sqlitePath } = require('../config/db');

console.log('Clearing all items and claims from database...');
clearAllData()
  .then(() => {
    console.log(`✅ All fake and test items removed from: ${sqlitePath}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Clear error:', err);
    process.exit(1);
  });
