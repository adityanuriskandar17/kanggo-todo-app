const express = require('express');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

function isValidDate(dateStr) {
  if (!dateStr) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}

function isBackdate(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const validStatuses = ['pending', 'in-progress', 'done'];

    let where = 'WHERE user_id = ?';
    let params = [req.user.id];

    if (status && validStatuses.includes(status)) {
      where += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      where += ' AND title LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM tasks ${where}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      tasks: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil daftar tugas.', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
    res.json({ task: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil tugas.', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, status, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ field: 'title', message: 'Judul tugas wajib diisi.' });
    }
    if (title.trim().length > 255) {
      return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    }
    if (deadline && !isValidDate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid (YYYY-MM-DD).' });
    }
    if (isBackdate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    }

    const validStatuses = ['pending', 'in-progress', 'done'];
    const taskStatus = status && validStatuses.includes(status) ? status : 'pending';

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, deadline, user_id) VALUES (?, ?, ?, ?, ?)',
      [title.trim(), description || null, taskStatus, deadline || null, req.user.id]
    );

    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Tugas berhasil dibuat.', task: task[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal membuat tugas.', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }

    const { title, description, status, deadline } = req.body;
    const task = existing[0];

    const newTitle = title !== undefined ? title : task.title;
    const newDescription = description !== undefined ? description : task.description;
    const newDeadline = deadline !== undefined ? deadline : task.deadline;

    if (!newTitle || !newTitle.trim()) {
      return res.status(400).json({ field: 'title', message: 'Judul tugas tidak boleh kosong.' });
    }
    if (newTitle.trim().length > 255) {
      return res.status(400).json({ field: 'title', message: 'Judul maksimal 255 karakter.' });
    }
    if (deadline !== undefined && deadline !== null && deadline !== '' && !isValidDate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Format deadline tidak valid (YYYY-MM-DD).' });
    }
    if (deadline !== undefined && deadline !== null && deadline !== '' && isBackdate(deadline)) {
      return res.status(400).json({ field: 'deadline', message: 'Deadline tidak boleh tanggal yang sudah lewat.' });
    }

    const validStatuses = ['pending', 'in-progress', 'done'];
    const newStatus = status && validStatuses.includes(status) ? status : task.status;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, deadline = ? WHERE id = ? AND user_id = ?',
      [newTitle.trim(), newDescription, newStatus, newDeadline, req.params.id, req.user.id]
    );

    const [updated] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tugas berhasil diperbarui.', task: updated[0] });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memperbarui tugas.', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan.' });
    }
    res.json({ message: 'Tugas berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus tugas.', error: err.message });
  }
});

module.exports = router;
