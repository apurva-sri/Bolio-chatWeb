const mongoose = require('mongoose');

const noteSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#fef3c7' // Default yellow sticky note color
  }
}, {
  timestamps: true
});

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
