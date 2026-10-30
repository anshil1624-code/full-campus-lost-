const http = require('http');
const { app, startServer } = require('../server');
const { allQuery, getQuery, sqlitePath } = require('../config/db');

// Helper to make HTTP JSON requests
const request = (server, method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: address.port,
      path: encodeURI(path),
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Automated API & Database Test Suite');
  console.log('====================================================\n');

  let server;
  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      testFailed++;
    }
  };

  try {
    // 1. Backend startup & health check
    server = await startServer();
    assert(server && server.listening, 'Backend server starts and listens successfully');

    const healthRes = await request(server, 'GET', '/api/health');
    assert(
      healthRes.status === 200 && healthRes.data.databaseMode === 'sqlite',
      'Health check reports OK and SQLite database mode',
      JSON.stringify(healthRes.data)
    );

    // 2. Aggregate statistics
    const statsRes = await request(server, 'GET', '/api/items/stats');
    assert(
      statsRes.status === 200 && typeof statsRes.data.totalItems === 'number',
      'Statistics endpoint responds with valid counts',
      `totalItems: ${statsRes.data.totalItems}`
    );

    // 3. Submit a lost-item report
    const newLostItem = {
      title: 'Automated Test: Lost Calculator (TI-84)',
      category: 'Electronics',
      description: 'Black graphic calculator left in math building',
      type: 'Lost',
      location: 'Euler Hall 202',
      date: '2026-10-24',
      contactName: 'Tester Student',
      contactEmail: 'tester@student.edu',
      contactPhone: '+1 (555) 111-2222'
    };

    const lostRes = await request(server, 'POST', '/api/items', newLostItem);
    assert(
      lostRes.status === 201 && lostRes.data.reportId && lostRes.data.reportId.startsWith('LF-'),
      'Lost-item report submitted with automatic unique Report ID',
      `Report ID: ${lostRes.data.reportId}`
    );
    const createdLostId = lostRes.data.item.id;
    const createdReportId = lostRes.data.reportId;

    // 4. Submit a found-item report
    const newFoundItem = {
      title: 'Automated Test: Found Scientific Calculator',
      category: 'Electronics',
      description: 'Found scientific calculator on desk',
      type: 'Found',
      location: 'Library 1st floor',
      date: '2026-10-24',
      contactName: 'Helpdesk Staff',
      contactEmail: 'helpdesk@campus.edu'
    };

    const foundRes = await request(server, 'POST', '/api/items', newFoundItem);
    assert(
      foundRes.status === 201 && foundRes.data.reportId && foundRes.data.reportId.startsWith('FD-'),
      'Found-item report submitted with automatic unique Report ID',
      `Report ID: ${foundRes.data.reportId}`
    );
    const createdFoundId = foundRes.data.item.id;

    // 5. Verification in SQLite storage
    const dbRecord = await getQuery('SELECT * FROM items WHERE id = ?', [createdLostId]);
    assert(
      dbRecord && dbRecord.title === newLostItem.title && dbRecord.reportId === createdReportId,
      'Submitted report exists in persistent SQLite database table'
    );

    // 6. Item details by ID and by Report ID
    const detailRes = await request(server, 'GET', `/api/items/${createdLostId}`);
    assert(
      detailRes.status === 200 && detailRes.data.item.title === newLostItem.title,
      'Item details load correctly by numerical ID'
    );

    const reportIdRes = await request(server, 'GET', `/api/items/${createdReportId}`);
    assert(
      reportIdRes.status === 200 && reportIdRes.data.item.id === createdLostId,
      'Item details load correctly by unique Report ID'
    );

    // 7. Search returns correct results
    const searchRes = await request(server, 'GET', '/api/items?search=Calculator');
    assert(
      searchRes.status === 200 && searchRes.data.items.some(i => i.id === createdLostId),
      'Search query "Calculator" matches created item'
    );

    // 8. Filters by category, type, and status
    const categoryRes = await request(server, 'GET', '/api/items?category=Electronics');
    assert(
      categoryRes.status === 200 && categoryRes.data.items.every(i => i.category === 'Electronics'),
      'Category filter returns only Electronics'
    );

    // 9. Claim workflow
    const claimRes = await request(server, 'POST', `/api/items/${createdLostId}/claim`, {
      claimantName: 'Alex Claims',
      claimantContact: 'alex.claims@student.edu',
      claimNotes: 'I left this on desk 4 with my initials AC on the back'
    });
    assert(
      claimRes.status === 200 && claimRes.data.item.status === 'Claim Pending',
      'Claim submitted successfully and status transitioned to "Claim Pending"'
    );

    const statusRes = await request(server, 'GET', '/api/items?status=Claim Pending');
    assert(
      statusRes.status === 200 && statusRes.data.items.some(i => i.id === createdLostId),
      'Status filter returns Claim Pending items'
    );

    // 10. Status update and state machine validation
    const statusUpdateRes = await request(server, 'PATCH', `/api/items/${createdLostId}/status`, {
      status: 'Returned / Recovered',
      note: 'Returned to Alex after ID check'
    });
    assert(
      statusUpdateRes.status === 200 && statusUpdateRes.data.item.status === 'Returned / Recovered',
      'Status updated to "Returned / Recovered"'
    );

    // 11. Invalid input and error handling
    const invalidPostRes = await request(server, 'POST', '/api/items', {
      title: 'Incomplete Item'
      // missing description, location, date, category, contact
    });
    assert(
      invalidPostRes.status === 400,
      'Invalid input without required fields is rejected with 400 Bad Request'
    );

    const invalidStatusRes = await request(server, 'PATCH', `/api/items/${createdLostId}/status`, {
      status: 'NonExistentStatus'
    });
    assert(
      invalidStatusRes.status === 400,
      'Invalid status value is rejected with 400 Bad Request'
    );

    // 12. Test database persistence across server restart
    console.log('\n  🔄 Simulating server shutdown & restart to verify SQLite persistence...');
    await new Promise((resolve) => server.close(resolve));

    // Start a new server instance against the same database file
    const restartedServer = await startServer();
    const persistedRes = await request(restartedServer, 'GET', `/api/items/${createdLostId}`);
    assert(
      persistedRes.status === 200 &&
      persistedRes.data.item.status === 'Returned / Recovered' &&
      persistedRes.data.item.reportId === createdReportId,
      'Data and status persist cleanly in SQLite across backend restart!'
    );

    // Clean up test items and claims
    await request(restartedServer, 'DELETE', `/api/items/${createdLostId}`);
    await request(restartedServer, 'DELETE', `/api/items/${createdFoundId}`);
    await allQuery('DELETE FROM claims WHERE itemId IN (?, ?)', [createdLostId, createdFoundId]);

    await new Promise((resolve) => restartedServer.close(resolve));

  } catch (err) {
    console.error('Fatal Test Exception:', err);
    testFailed++;
  }

  console.log('\n====================================================');
  console.log(`🏁 Test Summary: ${testPassed} Passed, ${testFailed} Failed`);
  console.log('====================================================\n');

  if (testFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
