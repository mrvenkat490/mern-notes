const router = require('express').Router();
const Note = require('../models/Note');

// GET all notes (with optional filters/search)
router.get('/', async (req, res) => {
  const { q, tags, pinned, archived, sort } = req.query;
  const filter = {};
  if (typeof pinned !== 'undefined') filter.pinned = pinned === 'true';
  if (typeof archived !== 'undefined') filter.archived = archived === 'true';
  if (tags) filter.tags = { $all: tags.split(',').map(t => t.trim()).filter(Boolean) };
  if (q && q.trim()) filter.$text = { $search: q.trim() };

  let query = Note.find(filter);
  if (sort) {
    const [f, dir] = sort.split(':');
    query = query.sort({ [f]: dir === 'asc' ? 1 : -1 });
  } else {
    query = query.sort({ updatedAt: -1 });
  }

  const notes = await query.exec();
  res.json(notes);
});

// GET single note
router.get('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id);
  res.json(note);
});

// CREATE new note
router.post('/', async (req, res) => {
  const note = await Note.create(req.body);
  res.status(201).json(note);
});

// UPDATE note
router.put('/:id', async (req, res) => {
  const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(note);
});

// TOGGLE pin
router.patch('/:id/pin', async (req, res) => {
  const note = await Note.findByIdAndUpdate(req.params.id, { pinned: req.body.pinned }, { new: true });
  res.json(note);
});

// TOGGLE archive
router.patch('/:id/archive', async (req, res) => {
  const note = await Note.findByIdAndUpdate(req.params.id, { archived: req.body.archived }, { new: true });
  res.json(note);
});

// DELETE note
router.delete('/:id', async (req, res) => {
  await Note.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
