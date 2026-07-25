import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ nama: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi.';
    else if (form.nama.trim().length < 2) errs.nama = 'Nama minimal 2 karakter.';
    if (!form.email) errs.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid.';
    if (!form.password) errs.password = 'Password wajib diisi.';
    else if (form.password.length < 6) errs.password = 'Password minimal 6 karakter.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Konfirmasi password tidak cocok.';
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'nama') {
      if (!value.trim()) msg = 'Nama wajib diisi.';
      else if (value.trim().length < 2) msg = 'Nama minimal 2 karakter.';
    } else if (field === 'email') {
      if (!value) msg = 'Email wajib diisi.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid.';
    } else if (field === 'password') {
      if (!value) msg = 'Password wajib diisi.';
      else if (value.length < 6) msg = 'Password minimal 6 karakter.';
      if (form.confirmPassword && value !== form.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Konfirmasi password tidak cocok.' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    } else if (field === 'confirmPassword') {
      if (value !== form.password) msg = 'Konfirmasi password tidak cocok.';
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

    try {
      const res = await api.post('/auth/register', {
        nama: form.nama, email: form.email, password: form.password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Registrasi gagal.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm mx-4 sm:mx-0">
        <div className="flex items-center justify-center gap-2 mb-6">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Daftar</h1>
        </div>

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nama ? 'border-red-400' : 'border-gray-300'}`}
              value={form.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
            />
            {errors.nama && <p className="text-xs text-red-500 mt-1">{errors.nama}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            Daftar
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
