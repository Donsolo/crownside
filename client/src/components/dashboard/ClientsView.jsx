import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { FaSearch, FaUserPlus, FaFileImport, FaPhone, FaEnvelope, FaEllipsisV } from 'react-icons/fa';
import ClientImportWizard from './ClientImportWizard';

const ClientsView = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        setFilteredClients(clients.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            (c.email && c.email.toLowerCase().includes(lower)) ||
            (c.phone && c.phone.includes(lower))
        ));
    }, [searchTerm, clients]);

    const fetchClients = async () => {
        try {
            const res = await api.get('/calendar/clients');
            setClients(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Client Rolodex</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {clients.length} {clients.length === 1 ? 'client' : 'clients'} in your list
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, phone..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-crown-gold focus:outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                    >
                        <FaUserPlus /> <span>Add Client</span>
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="btn-secondary bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                    >
                        <FaFileImport /> <span>Import</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading Rolodex...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <FaUserPlus size={24} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">No Clients Found</h3>
                        <p className="text-gray-500 max-w-sm mb-6">
                            {searchTerm ? `No results for "${searchTerm}"` : "You haven't added any clients yet. Add them manually or import from your old booking app."}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-crown-gold font-bold hover:underline"
                            >
                                + Add First Client
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredClients.map(client => (
                            <div key={client.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-crown-gold/10 text-crown-gold flex items-center justify-center font-serif font-bold text-lg">
                                            {client.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{client.name}</h4>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                {client.phone && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <FaPhone size={10} className="opacity-50" /> {client.phone}
                                                    </span>
                                                )}
                                                {client.email && (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                                        <FaEnvelope size={10} className="opacity-50" /> {client.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-gray-300 hover:text-gray-600 p-2 opacity-0 group-hover:opacity-100 transition">
                                        <FaEllipsisV />
                                    </button>
                                </div>

                                {client.notes && (
                                    <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500 italic">
                                        "{client.notes}"
                                    </div>
                                )}

                                {client.importSource && client.importSource !== 'MANUAL' && (
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 bg-gray-50 px-2 py-0.5 rounded">
                                            Imported via {client.importSource}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Client Modal */}
            {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onSuccess={() => {
                fetchClients();
                setShowAddModal(false);
            }} />}

            <ClientImportWizard
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    fetchClients();
                    // Optional: toast
                }}
            />
        </div>
    );
};

function AddClientModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/calendar/clients', formData);
            onSuccess();
        } catch (err) {
            alert('Failed to add client');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-enter">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
                <h3 className="text-xl font-serif font-bold mb-4">Add New Client</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Name</label>
                        <input
                            required
                            className="w-full p-2 border rounded-lg"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Phone</label>
                        <input
                            className="w-full p-2 border rounded-lg"
                            placeholder="(555) 555-5555"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-lg"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Notes</label>
                        <textarea
                            className="w-full p-2 border rounded-lg h-20"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-crown-dark text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-md"
                    >
                        {submitting ? 'Saving...' : 'Save Client'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ClientsView;
