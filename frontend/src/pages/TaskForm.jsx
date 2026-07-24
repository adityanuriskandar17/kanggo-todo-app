import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../api/axios';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function TaskForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    deadline: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/tasks/${id}`).then((res) => {
        const task = res.data.task;
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          deadline: task.deadline ? task.deadline.split('T')[0] : '',
        });
      }).catch(() => navigate('/'));
    }
  }, [id]);

  const isBackdate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Judul tugas wajib diisi.';
    else if (form.title.trim().length > 255) errs.title = 'Judul maksimal 255 karakter.';
    if (form.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(form.deadline)) {
      errs.deadline = 'Format tanggal tidak valid (YYYY-MM-DD).';
    } else if (isBackdate(form.deadline)) {
      errs.deadline = 'Deadline tidak boleh tanggal yang sudah lewat.';
    }
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'title') {
      if (!value.trim()) msg = 'Judul tugas wajib diisi.';
      else if (value.trim().length > 255) msg = 'Judul maksimal 255 karakter.';
    } else if (field === 'deadline') {
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) msg = 'Format tanggal tidak valid (YYYY-MM-DD).';
      else if (isBackdate(value)) msg = 'Deadline tidak boleh tanggal yang sudah lewat.';
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    validateField(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/tasks/${id}`, form);
      } else {
        await api.post('/tasks', form);
      }
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Gagal menyimpan tugas.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Tugas' : 'Tambah Tugas'}
      </h1>

      {errors.form && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Judul <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
          <input
            type="date"
            min={today}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.deadline ? 'border-red-400' : 'border-gray-300'}`}
            value={form.deadline}
            onChange={(e) => handleChange('deadline', e.target.value)}
          />
          {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Tugas'}
        </button>
      </form>
    </div>
  );
}
