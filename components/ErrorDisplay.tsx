import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ErrorDisplay = ({ message, onClose }: { message: string; onClose: () => void }) => {
    return (
        <div className="max-w-3xl mx-auto w-full mb-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-red-300">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{message}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-red-500/10 rounded-full text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};