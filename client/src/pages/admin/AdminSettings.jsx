import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Shield, Key } from 'lucide-react';

export default function AdminSettings() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-serif font-bold text-crown-dark">Admin Settings</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-crown-dark text-white flex items-center justify-center text-3xl font-bold">
                        {user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Administrator Profile</h2>
                        <div className="flex items-center gap-2 text-gray-500 mb-4">
                            <Shield size={16} className="text-green-600" />
                            <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                Super Admin
                            </span>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</label>
                                <div className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                    {user.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">User ID</label>
                                <div className="text-gray-500 font-mono text-sm">
                                    {user.id}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Key size={18} /> Security
                            </h3>
                            <button className="btn-secondary text-sm" onClick={() => alert('Password reset flow would go here.')}>
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
