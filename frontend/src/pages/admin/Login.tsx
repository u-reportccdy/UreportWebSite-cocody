import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pour le moment en dur, on pourra connecter une API plus tard
    if (email === 'admin@ureport.ci' && password === 'admin225') {
      localStorage.setItem('admin_session', 'true');
      navigate('/admin');
    } else {
      setError('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-extrabold tracking-tight mb-2">
            <span className="text-[#0099DC]">U</span>
            <span className="text-gray-900 ml-0.5">Report</span>
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-[#0099DC] bg-[#0099DC]/10 px-3 py-1 rounded-full border border-[#0099DC]/20">
            Espace Administration
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Adresse Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ureport.ci"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Mot de passe</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0099DC] focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0099DC] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#007bb5] transform transition active:scale-[0.98] shadow-lg shadow-[#0099DC]/20"
          >
            Se connecter
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          En cas de perte d'accès, contactez le support technique.
        </p>
      </motion.div>
    </div>
  );
}
