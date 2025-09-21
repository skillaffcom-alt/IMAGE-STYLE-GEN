import React, { useState } from 'react';
import { KeyIcon } from './Icons';

interface ApiKeyModalProps {
    onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onSave(apiKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                                <KeyIcon className="w-6 h-6" />
                            </div>
                            <h2 id="api-key-modal-title" className="text-xl font-bold text-slate-800">
                                Enter Your Gemini API Key
                            </h2>
                        </div>
                        <p className="text-sm text-slate-600">
                            To use this application, you need a Gemini API key. Your key will be saved in your browser's local storage and will not be shared.
                        </p>
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 sr-only">
                                API Key
                            </label>
                            <input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API key here..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                required
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                            Don't have a key? Get one from{' '}
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">
                                Google AI Studio
                            </a>.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-b-xl">
                        <button
                            type="submit"
                            disabled={!apiKey.trim()}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Save and Continue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
