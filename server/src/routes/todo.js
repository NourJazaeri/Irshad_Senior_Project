import express from 'express';
import ToDoList from '../models/Todo.js';

const router = express.Router();

// GET all todos for a trainee
router.get('/:traineeId', async (req, res) => {
  try {
    const { traineeId } = req.params;
    const items = await ToDoList.find({ traineeId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('Failed to fetch todos:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST create a todo
router.post('/', async (req, res) => {
  try {
    const { traineeId, day, title } = req.body;
    if (!traineeId || !day || !title) {
      return res.status(400).json({ ok: false, error: 'traineeId, day and title are required' });
    }
    const created = await ToDoList.create({ traineeId, day, title });
    res.status(201).json(created);
  } catch (err) {
    console.error('Failed to create todo:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH update a todo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ ok: false, error: 'Title is required' });
    }
    const updated = await ToDoList.findByIdAndUpdate(
      id,
      { $set: { title } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: 'Todo not found' });
    res.json(updated);
  } catch (err) {
    console.error('Failed to update todo:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH mark a todo as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ToDoList.findByIdAndUpdate(
      id,
      { $set: { isCompleted: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: 'Todo not found' });
    res.json(updated);
  } catch (err) {
    console.error('Failed to complete todo:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE a single todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ToDoList.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ ok: false, error: 'Todo not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete todo:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE all completed todos for a trainee
router.delete('/completed/:traineeId', async (req, res) => {
  try {
    const { traineeId } = req.params;
    const result = await ToDoList.deleteMany({ traineeId, isCompleted: true });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Failed to delete completed todos:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
