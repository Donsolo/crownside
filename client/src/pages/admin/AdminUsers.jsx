import React, { useState, useEffect, Fragment } from 'react';
import api from '../../lib/api';
import { Search, Trash2, Mail, Shield, Edit, X, Save } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { useTheme } from '../../context/ThemeContext';

const EditRoleModal = ({ user, onClose, onSave }) => {
    const [role, setRole] = useState(user.role);
    const [loading, setLoading] = useState(false);
    const { theme } = useTheme();

    const handleSave = async () => {
        setLoading(true);
        await onSave(user.id, role);
        setLoading(false);
    };

    return (
        <Transition.Root show={true} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className={`relative transform overflow-hidden rounded-lg px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Shield className="h-6 w-6 text-blue-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className={`text-base font-semibold leading-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            Edit User Role
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                Change role for <span className="font-bold">{user.email}</span>
                                            </p>
                                            <div className="mt-4">
                                                <select
                                                    value={role}
                                                    onChange={(e) => setRole(e.target.value)}
                                                    className={`mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset focus:ring-2 sm:text-sm sm:leading-6 ${theme === 'dark'
                                                            ? 'bg-gray-700 text-white ring-gray-600 focus:ring-crown-gold'
                                                            : 'text-gray-900 ring-gray-300 focus:ring-crown-gold'
                                                        }`}
                                                >
                                                    <option value="CLIENT">Client</option>
                                                    <option value="STYLIST">Stylist</option>
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="MODERATOR">Moderator</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-md bg-crown-gold px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-crown-gold-light sm:ml-3 sm:w-auto"
                                        onClick={handleSave}
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset sm:mt-0 sm:w-auto ${theme === 'dark'
                                                ? 'bg-gray-700 text-gray-300 ring-gray-600 hover:bg-gray-600'
                                                : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const { theme } = useTheme();

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

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const res = await api.put(`/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: res.data.role } : u));
            setEditingUser(null);
        } catch (err) {
            console.error("Failed to update role", err);
            alert("Failed to update role");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const RoleBadge = ({ role }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                role === 'STYLIST' ? 'bg-crown-gold/10 text-crown-gold' :
                    role === 'MODERATOR' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
            }`}>
            {role}
        </span>
    );

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className={`sticky top-0 z-20 pt-4 pb-4 ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-gray-50/95'} backdrop-blur-sm`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className={`text-2xl sm:text-3xl font-serif font-bold ${theme === 'dark' ? 'text-white' : 'text-crown-dark'}`}>
                        Users ({filteredUsers.length})
                    </h1>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className={`w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg ${theme === 'dark'
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-crown-gold'
                                    : 'bg-white border-gray-200 focus:border-crown-gold'
                                }`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className={`hidden md:block rounded-xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                <table className="w-full text-left">
                    <thead className={theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}>
                        <tr>
                            <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>User</th>
                            <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Role</th>
                            <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Joined</th>
                            <th className={`p-4 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-50'}`}>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className={`transition ${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-crown-cream flex items-center justify-center text-crown-gold font-bold">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</div>
                                            <div className="text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button
                                        className="text-blue-400 hover:text-blue-600 p-1"
                                        onClick={() => setEditingUser(user)}
                                        title="Edit Role"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button className="text-red-400 hover:text-red-600 p-1" title="Delete (Mock)">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-4">
                {filteredUsers.map(user => (
                    <div key={user.id} className={`p-4 rounded-xl shadow-sm border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-crown-cream flex items-center justify-center text-crown-gold font-bold text-lg">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</div>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                                <button
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg dark:bg-blue-900/30 dark:text-blue-400"
                                    onClick={() => setEditingUser(user)}
                                >
                                    <Edit size={18} />
                                </button>
                                <button className="p-2 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-400">No users found.</div>
            )}

            {editingUser && (
                <EditRoleModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdateRole}
                />
            )}
        </div>
    );
}
