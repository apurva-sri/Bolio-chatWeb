const Note = require("../models/Note");

// GET /api/notes
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({
      isPinned: -1,
      updatedAt: -1,
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/notes
const createNote = async (req, res) => {
  try {
    const { title, content, color, reminderAt } = req.body;
    const note = await Note.create({
      user:       req.user._id,
      title:      title || "Untitled",
      content:    content || "",
      color:      color || "#1e2a30",
      reminderAt: reminderAt || null,
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notes/:id
const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!note) return res.status(404).json({ message: "Note not found" });

    const { title, content, color, reminderAt, isPinned } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (reminderAt !== undefined) {
      note.reminderAt = reminderAt;
      note.reminderSent = false; // reset so reminder fires again
    }

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/notes/due  — called by server cron / socket to get due reminders
const getDueReminders = async () => {
  const now  = new Date();
  const due  = await Note.find({
    reminderAt:   { $lte: now },
    reminderSent: false,
  });
  await Note.updateMany(
    { _id: { $in: due.map((n) => n._id) } },
    { $set: { reminderSent: true } }
  );
  return due;
};

module.exports = { getNotes, createNote, updateNote, deleteNote, getDueReminders };
