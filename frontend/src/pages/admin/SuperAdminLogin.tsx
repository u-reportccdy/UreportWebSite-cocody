import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

export function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/superadmin/login', { email, password });
      const data = response.data?.data;
      if (!data?.token) throw new Error('Invalid auth response');
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_role', 'superadmin');
      sessionStorage.setItem('admin_email', data.email || email.trim().toLowerCase());
      navigate('/superadmin');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Connexion superadmin impossible.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-extrabold tracking-tight mb-2">
            <span className="text-[#0099DC]">U</span><span className="text-gray-900 ml-0.5">Report</span>
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Super Admin
          </span>
        </div>
        <form onSubmit={handleLogin} className="space-y-6" autoComplete="off">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">{error}</div>}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Adresse Email</label>
            <input required type="email" name="superadmin_email_no_autofill" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Mot de passe</label>
            <div className="relative">
              <input required type={showPassword ? 'text' : 'password'} name="superadmin_password_no_autofill" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent" />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#0099DC] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#007bb5] transition shadow-lg shadow-[#0099DC]/20">Se connecter</button>
        </form>
      </motion.div>
    </div>
  );
}
