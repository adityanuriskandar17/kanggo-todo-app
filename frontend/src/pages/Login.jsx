import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email wajib diisi.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Format email tidak valid.';
    if (!form.password) errs.password = 'Password wajib diisi.';
    return errs;
  };

  const validateField = (field, value) => {
    let msg = '';
    if (field === 'email') {
      if (!value) msg = 'Email wajib diisi.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid.';
    } else if (field === 'password') {
      if (!value) msg = 'Password wajib diisi.';
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
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin();
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        setErrors((prev) => ({ ...prev, [data.field]: data.message }));
      } else {
        setErrors({ form: data?.message || 'Login gagal.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm mx-4 sm:mx-0">
        <div className="flex items-center justify-center gap-2 mb-6">
          <LogIn className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Masuk</h1>
        </div>

        {errors.form && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">{errors.form}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            Masuk
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
