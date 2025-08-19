const { Schema, model } = require('mongoose');

const NoteSchema = new Schema({
  title: { type: String, default: '' },
  content: { type: String, default: '' },     // store rich text (from React-Quill)
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

NoteSchema.index({ title: 'text', content: 'text' }); // enables text search

module.exports = model('Note', NoteSchema);
