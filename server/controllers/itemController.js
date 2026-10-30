const ItemRepository = require('../repositories/itemRepository');
const path = require('path');
const fs = require('fs');

/**
 * Generate unique report ID (e.g., LF-2026-8942 or FD-2026-3819)
 */
const generateReportId = (type = 'Lost') => {
  const prefix = type.toLowerCase() === 'found' ? 'FD' : 'LF';
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomSuffix}`;
};

// GET /api/items (supports search, category, type, status, location filters)
const getItems = async (req, res) => {
  try {
    const { search, category, type, status, location } = req.query;
    const items = await ItemRepository.getAll({ search, category, type, status, location });
    res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to retrieve items.', error: error.message });
  }
};

// GET /api/items/stats
const getItemStats = async (req, res) => {
  try {
    const stats = await ItemRepository.getStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ message: 'Failed to retrieve stats.', error: error.message });
  }
};

// GET /api/items/:id (supports both numerical ID and reportId like LF-2026-1001)
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    let item = null;

    if (id.startsWith('LF-') || id.startsWith('FD-')) {
      item = await ItemRepository.getByReportId(id);
    } else {
      item = await ItemRepository.getById(id);
    }

    if (!item) {
      return res.status(404).json({ message: `Item not found with identifier: ${id}` });
    }

    res.status(200).json({ item });
  } catch (error) {
    console.error('Error fetching item details:', error);
    res.status(500).json({ message: 'Failed to retrieve item details.', error: error.message });
  }
};

// POST /api/items (create lost or found report with auto-generated Report ID)
const createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type = 'Lost',
      location,
      date,
      contactName,
      contactEmail,
      contactPhone,
      contact
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location || !date) {
      return res.status(400).json({
        message: 'Missing required report fields: title, description, category, location, and date are required.'
      });
    }

    const resolvedContactName = contactName ? contactName.trim() : (req.user ? req.user.name : 'Campus Student');
    const resolvedContactEmail = contactEmail ? contactEmail.trim() : (req.user ? req.user.email : '');
    const resolvedContactPhone = contactPhone ? contactPhone.trim() : '';

    if (!resolvedContactName && !contact) {
      return res.status(400).json({
        message: 'A contact name or contact method is required so the item can be claimed.'
      });
    }

    let imagePath = '';
    if (req.file) {
      imagePath = '/uploads/' + req.file.filename;
    }

    const reportId = generateReportId(type);
    const userId = req.user ? req.user.id : 2; // Default student user if anonymous
    const initialStatus = type.toLowerCase() === 'found' ? 'Found' : 'Lost';

    const itemId = await ItemRepository.create({
      reportId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      type: type.toLowerCase() === 'found' ? 'Found' : 'Lost',
      status: initialStatus,
      location: location.trim(),
      date,
      image: imagePath,
      contactName: resolvedContactName,
      contactEmail: resolvedContactEmail,
      contactPhone: resolvedContactPhone,
      contact: contact ? contact.trim() : [resolvedContactName, resolvedContactEmail, resolvedContactPhone].filter(Boolean).join(' | '),
      userId
    });

    const newItem = await ItemRepository.getById(itemId);

    res.status(201).json({
      message: `${newItem.type} item reported successfully! Report ID: ${reportId}`,
      reportId,
      item: newItem
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Failed to post item.', error: error.message });
  }
};

// PUT /api/items/:id (update item details)
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const existingItem = await ItemRepository.getById(id);

    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Check authorization if user authenticated
    if (req.user && req.user.role !== 'admin' && existingItem.userId && existingItem.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You can only modify your own posts.' });
    }

    const {
      title,
      description,
      category,
      type,
      location,
      date,
      contactName,
      contactEmail,
      contactPhone,
      contact
    } = req.body;

    let imagePath = existingItem.image;
    if (req.file) {
      // Remove old image file safely
      if (existingItem.image && existingItem.image.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', existingItem.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = '/uploads/' + req.file.filename;
    }

    await ItemRepository.update(id, {
      title: title ? title.trim() : existingItem.title,
      description: description ? description.trim() : existingItem.description,
      category: category || existingItem.category,
      type: type || existingItem.type,
      location: location ? location.trim() : existingItem.location,
      date: date || existingItem.date,
      image: imagePath,
      contactName: contactName || existingItem.contactName,
      contactEmail: contactEmail || existingItem.contactEmail,
      contactPhone: contactPhone || existingItem.contactPhone,
      contact: contact || existingItem.contact
    });

    const updated = await ItemRepository.getById(id);
    res.status(200).json({ message: 'Item updated successfully.', item: updated });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item.', error: error.message });
  }
};

// PATCH /api/items/:id/status (transition item status)
const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Target status is required.' });
    }

    const updated = await ItemRepository.updateStatus(id, status, note);
    res.status(200).json({
      message: `Item status successfully updated to "${status}".`,
      item: updated
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(400).json({ message: error.message });
  }
};

// POST /api/items/:id/claim (claim workflow)
const claimItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { claimantName, claimantContact, claimNotes } = req.body;

    if (!claimantName || !claimantContact) {
      return res.status(400).json({
        message: 'Claimant name and contact information are required to submit a claim.'
      });
    }

    const updated = await ItemRepository.submitClaim(id, {
      claimantName: claimantName.trim(),
      claimantContact: claimantContact.trim(),
      claimNotes: claimNotes ? claimNotes.trim() : ''
    });

    res.status(200).json({
      message: 'Claim submitted successfully! Status updated to Claim Pending.',
      item: updated
    });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ItemRepository.getById(id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (item.image && item.image.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await ItemRepository.delete(id);
    res.status(200).json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item.', error: error.message });
  }
};

module.exports = {
  getItems,
  getItemStats,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  claimItem,
  deleteItem
};
