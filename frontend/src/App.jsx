import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskForm from './pages/TaskForm';

export default function App() {
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState(storedUser ? JSON.parse(storedUser) : null);

  const handleLogin = () => {
    setUser(JSON.parse(localStorage.getItem('user')));
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tugas-baru"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-tugas/:id"
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
