const Note = require('../models/Note');
const Reminder = require('../models/Reminder');
const logger = require('../config/logger');

// ─── NOTES ───
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, notes });
  } catch (error) {
    logger.error(`[Notes API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createNote = async (req, res) => {
  try {
    const { title, content, color } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      color
    });
    res.status(201).json({ success: true, note });
  } catch (error) {
    logger.error(`[Notes API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteNote = async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (error) {
    logger.error(`[Notes API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── REMINDERS ───
const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, reminders });
  } catch (error) {
    logger.error(`[Reminders API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createReminder = async (req, res) => {
  try {
    const { title, dueDate, priority } = req.body;
    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      dueDate,
      priority
    });
    res.status(201).json({ success: true, reminder });
  } catch (error) {
    logger.error(`[Reminders API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (reminder) {
      reminder.isCompleted = !reminder.isCompleted;
      await reminder.save();
    }
    res.status(200).json({ success: true, reminder });
  } catch (error) {
    logger.error(`[Reminders API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteReminder = async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true, message: 'Reminder deleted' });
  } catch (error) {
    logger.error(`[Reminders API] Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getNotes, createNote, deleteNote,
  getReminders, createReminder, toggleReminder, deleteReminder
};
