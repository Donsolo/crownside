import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const res = await api.post('/auth/login', formData);
            login(res.data.user, res.data.token);

            if (res.data.user.role === 'STYLIST') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="w-full max-w-md bg-[var(--card-bg)] p-8 rounded-2xl shadow-lg border border-[var(--card-border)] animate-enter transition-colors duration-300">
                <h2 className="text-3xl font-serif text-center mb-8 text-[var(--text-primary)]">Welcome Back</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none transition-colors duration-300 placeholder-[var(--text-secondary)]"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-[var(--border-input)] bg-[var(--input-background)] text-[var(--input-text)] focus:ring-2 focus:ring-crown-gold focus:outline-none pr-10 transition-colors duration-300 placeholder-[var(--text-secondary)]"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary bg-crown-dark text-white py-3 rounded-full hover:bg-black transition">
                        Log In
                    </button>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-[var(--text-secondary)]">Need an account? </span>
                        <Link to="/register" className="text-crown-gold font-medium hover:underline">
                            Register here
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
