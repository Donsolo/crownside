import React, { useState } from 'react';
import api from '../../lib/api';
import { FaFileCsv, FaUpload, FaCheckCircle, FaTimes, FaSpinner, FaCloudUploadAlt } from 'react-icons/fa';

export default function ClientImportWizard({ isOpen, onClose, onSuccess }) {
    if (!isOpen) return null;

    const [step, setStep] = useState(1); // 1: Source, 2: Upload, 3: Success
    const [source, setSource] = useState(null); // 'BOOKSY', 'STYLESEAT', 'CSV'
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !source) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('source', source);

        try {
            const res = await api.post('/calendar/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStats(res.data.stats);
            setStep(3);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Import failed. Please check your file.');
        } finally {
            setUploading(false);
        }
    };

    // Render Steps
    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold">Select Import Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { id: 'BOOKSY', label: 'Booksy Export', desc: 'Import client list CSV' },
                    { id: 'STYLESEAT', label: 'StyleSeat Export', desc: 'Import client list CSV' },
                    { id: 'CSV', label: 'Generic CSV', desc: 'Columns: Name, Email, Phone' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => { setSource(opt.id); setStep(2); }}
                        className="p-4 border rounded-xl hover:border-crown-gold hover:bg-crown-gold/5 transition text-left group"
                    >
                        <div className="font-bold text-gray-900 group-hover:text-crown-dark">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 text-center">
            <h3 className="text-lg font-bold">Upload {source === 'CSV' ? 'CSV' : source} File</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 hover:bg-gray-100 transition relative">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <FaCloudUploadAlt size={32} className="text-gray-400" />
                    <p className="font-bold text-gray-600">
                        {file ? file.name : 'Click or Drag file here'}
                    </p>
                    <p className="text-xs text-gray-400">Supported: .csv</p>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded">{error}</div>}

            <div className="flex gap-3 justify-end pt-2">
                <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-800 font-medium"
                    disabled={uploading}
                >
                    Back
                </button>
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="btn-primary bg-crown-dark text-white px-6 py-2 rounded-lg shadow-md hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {uploading && <FaSpinner className="animate-spin" />}
                    {uploading ? 'Importing...' : 'Start Import'}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">Import Successful!</h3>
            <p className="text-gray-600 mb-6">
                We successfully imported <span className="font-bold text-gray-900">{stats?.imported || 0}</span> clients to your Rolodex.
            </p>
            <button
                onClick={() => { onSuccess(); onClose(); }}
                className="btn-primary bg-crown-dark text-white px-8 py-3 rounded-xl shadow-md hover:bg-black transition"
            >
                Done
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-enter">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <FaTimes />
                </button>

                {step < 3 && (
                    <div className="mb-6 border-b pb-4">
                        <span className="text-xs font-bold text-crown-gold uppercase tracking-wider">Step {step} of 2</span>
                        <h2 className="text-2xl font-serif font-bold mt-1">Import Clients</h2>
                    </div>
                )}

                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </div>
        </div>
    );
}
