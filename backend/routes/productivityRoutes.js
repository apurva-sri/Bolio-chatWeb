const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotes, createNote, deleteNote,
  getReminders, createReminder, toggleReminder, deleteReminder
} = require('../controllers/productivityController');

// All routes are protected
router.use(protect);

// Notes routes
router.route('/notes')
  .get(getNotes)
  .post(createNote);
router.route('/notes/:id')
  .delete(deleteNote);

// Reminders routes
router.route('/reminders')
  .get(getReminders)
  .post(createReminder);
router.route('/reminders/:id')
  .put(toggleReminder)
  .delete(deleteReminder);

module.exports = router;
