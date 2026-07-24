import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Clock, CheckCircle, Circle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import api from '../api/axios';

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, class: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
  'in-progress': { label: 'In Progress', icon: Clock, class: 'text-blue-500 bg-blue-50 border-blue-200' },
  done: { label: 'Done', icon: CheckCircle, class: 'text-green-500 bg-green-50 border-green-200' },
};

const statusOptions = [
  { value: '', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const fetchTasks = async (searchVal, filterVal, pageVal) => {
    setLoading(true);
    try {
      const params = { page: pageVal, limit: 10 };
      if (filterVal) params.status = filterVal;
      if (searchVal.trim()) params.search = searchVal.trim();
      const res = await api.get('/tasks', { params });
      setTasks(res.data.tasks);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  useEffect(() => {
    fetchTasks(search, filter, page);
  }, [filter, page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTasks(val, filter, 1);
    }, 300);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tasks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTasks(search, filter, page);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' +
      d.getFullYear();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tugas Saya</h1>
        <button
          onClick={() => navigate('/tugas-baru')}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Tugas
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari tugas..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              filter === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-8">Memuat...</p>
      ) : tasks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Belum ada tugas.</p>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {tasks.map((task) => {
              const st = statusConfig[task.status] || statusConfig.pending;
              const Icon = st.icon;
              return (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${st.class}`}
                        >
                          <Icon className="w-3 h-3" />
                          {st.label}
                        </span>
                        {task.deadline && (
                          <span className="text-xs text-gray-400">
                            Deadline: {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => navigate(`/edit-tugas/${task.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Tugas"
        message={`Apakah kamu yakin ingin menghapus tugas "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
