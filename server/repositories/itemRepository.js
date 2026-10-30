const { runQuery, getQuery, allQuery } = require('../config/db');

// Valid status list
const VALID_STATUSES = ['Lost', 'Found', 'Claim Pending', 'Returned / Recovered'];

// Status transition state machine
const ALLOWED_TRANSITIONS = {
  'Lost': ['Lost', 'Claim Pending', 'Returned / Recovered'],
  'Found': ['Found', 'Claim Pending', 'Returned / Recovered'],
  'Claim Pending': ['Claim Pending', 'Returned / Recovered', 'Lost', 'Found'],
  'Returned / Recovered': ['Returned / Recovered', 'Lost', 'Found'] // Can be reopened if error
};

const ItemRepository = {
  /**
   * Validate if a status transition is permitted
   */
  isValidTransition(currentStatus, targetStatus) {
    if (!VALID_STATUSES.includes(targetStatus)) {
      return false;
    }
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    return allowed ? allowed.includes(targetStatus) : true;
  },

  /**
   * Retrieve all items matching search and filters
   */
  async getAll({ search, category, type, status, location } = {}) {
    let sql = `
      SELECT items.*, users.name as posterName, users.email as posterEmail
      FROM items
      LEFT JOIN users ON items.userId = users.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      sql += ` AND (
        items.title LIKE ? OR 
        items.description LIKE ? OR 
        items.location LIKE ? OR 
        items.category LIKE ? OR
        items.reportId LIKE ?
      )`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category && category !== 'All') {
      sql += ` AND items.category = ?`;
      params.push(category);
    }

    if (type && type !== 'All') {
      sql += ` AND items.type = ?`;
      params.push(type);
    }

    if (status && status !== 'All') {
      sql += ` AND items.status = ?`;
      params.push(status);
    }

    if (location && location !== 'All' && location.trim()) {
      sql += ` AND items.location LIKE ?`;
      params.push(`%${location.trim()}%`);
    }

    sql += ` ORDER BY items.createdAt DESC`;
    return await allQuery(sql, params);
  },

  /**
   * Get item by numerical ID
   */
  async getById(id) {
    const sql = `
      SELECT items.*, users.name as posterName, users.email as posterEmail
      FROM items
      LEFT JOIN users ON items.userId = users.id
      WHERE items.id = ?
    `;
    return await getQuery(sql, [id]);
  },

  /**
   * Get item by unique alphanumeric reportId
   */
  async getByReportId(reportId) {
    const sql = `
      SELECT items.*, users.name as posterName, users.email as posterEmail
      FROM items
      LEFT JOIN users ON items.userId = users.id
      WHERE items.reportId = ?
    `;
    return await getQuery(sql, [reportId]);
  },

  /**
   * Get items created by a specific user
   */
  async getByUserId(userId) {
    const sql = `
      SELECT * FROM items WHERE userId = ? ORDER BY createdAt DESC
    `;
    return await allQuery(sql, [userId]);
  },

  /**
   * Create a new item record
   */
  async create(data) {
    const {
      reportId,
      title,
      description,
      category,
      type,
      status = type === 'Lost' ? 'Lost' : 'Found',
      location,
      date,
      image = '',
      contactName,
      contactEmail = '',
      contactPhone = '',
      contact,
      userId = null
    } = data;

    const fullContact = contact || [contactName, contactEmail, contactPhone].filter(Boolean).join(' | ');

    const result = await runQuery(
      `INSERT INTO items (
        reportId, title, description, category, type, status, location, date,
        image, contactName, contactEmail, contactPhone, contact, userId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        title,
        description,
        category,
        type,
        status,
        location,
        date,
        image,
        contactName,
        contactEmail,
        contactPhone,
        fullContact,
        userId
      ]
    );

    return result.lastID;
  },

  /**
   * Update full item fields
   */
  async update(id, data) {
    const {
      title,
      description,
      category,
      type,
      location,
      date,
      image,
      contactName,
      contactEmail,
      contactPhone,
      contact
    } = data;

    const fullContact = contact || [contactName, contactEmail, contactPhone].filter(Boolean).join(' | ');

    let sql = `
      UPDATE items
      SET title = ?, description = ?, category = ?, type = ?, location = ?, date = ?,
          contactName = ?, contactEmail = ?, contactPhone = ?, contact = ?, updatedAt = CURRENT_TIMESTAMP
    `;
    const params = [
      title,
      description,
      category,
      type,
      location,
      date,
      contactName || '',
      contactEmail || '',
      contactPhone || '',
      fullContact
    ];

    if (image !== undefined) {
      sql += `, image = ?`;
      params.push(image);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    return await runQuery(sql, params);
  },

  /**
   * Update item status with validation
   */
  async updateStatus(id, newStatus, note = '') {
    const item = await this.getById(id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (!this.isValidTransition(item.status, newStatus)) {
      throw new Error(`Invalid status transition from "${item.status}" to "${newStatus}".`);
    }

    let sql = `UPDATE items SET status = ?, updatedAt = CURRENT_TIMESTAMP`;
    const params = [newStatus];

    if (note) {
      sql += `, claimNotes = ?`;
      params.push(note);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    await runQuery(sql, params);
    return await this.getById(id);
  },

  /**
   * Submit a claim for an item
   */
  async submitClaim(id, { claimantName, claimantContact, claimNotes }) {
    const item = await this.getById(id);
    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status === 'Returned / Recovered') {
      throw new Error('This item has already been returned and recovered.');
    }

    // Insert into claims table
    await runQuery(
      `INSERT INTO claims (itemId, claimantName, claimantContact, claimNotes, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [id, claimantName, claimantContact, claimNotes || '']
    );

    // Update item status to 'Claim Pending'
    await runQuery(
      `UPDATE items
       SET status = 'Claim Pending', claimantName = ?, claimantContact = ?, claimNotes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [claimantName, claimantContact, claimNotes || '', id]
    );

    return await this.getById(id);
  },

  /**
   * Delete an item
   */
  async delete(id) {
    return await runQuery(`DELETE FROM items WHERE id = ?`, [id]);
  },

  /**
   * Retrieve aggregate statistics
   */
  async getStats() {
    const totalCount = await getQuery(`SELECT COUNT(*) as count FROM items`);
    const lostCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE status = 'Lost'`);
    const foundCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE status = 'Found'`);
    const claimPendingCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE status = 'Claim Pending'`);
    const recoveredCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE status = 'Returned / Recovered'`);

    return {
      totalItems: parseInt(totalCount.count || 0, 10),
      totalLost: parseInt(lostCount.count || 0, 10),
      totalFound: parseInt(foundCount.count || 0, 10),
      totalClaimPending: parseInt(claimPendingCount.count || 0, 10),
      totalRecovered: parseInt(recoveredCount.count || 0, 10)
    };
  },

  /**
   * User-specific statistics
   */
  async getUserStats(userId) {
    const totalCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE userId = ?`, [userId]);
    const lostCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE userId = ? AND type = 'Lost'`, [userId]);
    const foundCount = await getQuery(`SELECT COUNT(*) as count FROM items WHERE userId = ? AND type = 'Found'`, [userId]);
    const recoveredCount = await getQuery(
      `SELECT COUNT(*) as count FROM items WHERE userId = ? AND status = 'Returned / Recovered'`,
      [userId]
    );

    return {
      userTotal: parseInt(totalCount.count || 0, 10),
      userLost: parseInt(lostCount.count || 0, 10),
      userFound: parseInt(foundCount.count || 0, 10),
      userRecovered: parseInt(recoveredCount.count || 0, 10)
    };
  }
};

module.exports = ItemRepository;
