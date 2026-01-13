import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Search, Trash2, Mail, Shield } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-serif font-bold text-crown-dark">Users</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">User</th>
                            <th className="p-4 font-semibold text-gray-600">Role</th>
                            <th className="p-4 font-semibold text-gray-600">Joined</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-crown-cream flex items-center justify-center text-crown-gold font-bold">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{user.email}</div>
                                            <div className="text-xs text-gray-400 font-mono">{user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'STYLIST' ? 'bg-crown-gold/10 text-crown-gold' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <button className="text-red-400 hover:text-red-600 p-1" title="Delete User (Mock)">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-gray-400">No users found.</div>
                )}
            </div>
        </div>
    );
}
