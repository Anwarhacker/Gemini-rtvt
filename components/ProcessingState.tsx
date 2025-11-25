import React from 'react';
import { RefreshCw, ScanEye, BookOpen, Wand2, Languages } from 'lucide-react';

export const ProcessingState = ({ mode, grammarCheck }: { mode: string; grammarCheck: boolean }) => {
    let icon = <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />;
    let text = "Processing...";
    let colorClass = "text-indigo-400 border-indigo-500/20 bg-indigo-500/10";

    if (mode === 'VISION') {
        icon = <ScanEye className="w-4 h-4 animate-pulse text-purple-400" />;
        text = "Analyzing Image & Context...";
        colorClass = "text-purple-300 border-purple-500/20 bg-purple-500/10";
    } else if (mode === 'DICTIONARY') {
        icon = <BookOpen className="w-4 h-4 animate-bounce text-amber-400" />;
        text = "Consulting Dictionary...";
        colorClass = "text-amber-300 border-amber-500/20 bg-amber-500/10";
    } else if (grammarCheck) {
        icon = <Wand2 className="w-4 h-4 animate-pulse text-pink-400" />;
        text = "Polishing Grammar & Translating...";
        colorClass = "text-pink-300 border-pink-500/20 bg-pink-500/10";
    } else {
        icon = <Languages className="w-4 h-4 animate-pulse text-indigo-400" />;
        text = "Translating...";
    }

    return (
        <div className={`flex gap-3 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-slate-900 ${colorClass.split(' ')[1]}`}>
                {icon}
            </div>
            <div className={`flex items-center gap-3 text-xs sm:text-sm px-4 py-3 rounded-2xl rounded-tl-none border ${colorClass}`}>
                <span className="font-medium tracking-wide">{text}</span>
            </div>
        </div>
    );
};