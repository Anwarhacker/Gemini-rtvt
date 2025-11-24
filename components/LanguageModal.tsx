import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { Language } from '../types';
import { LANGUAGES } from '../constants';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lang: Language) => void;
  selectedLang: Language;
  title: string;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, onSelect, selectedLang, title }) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;
  const filteredLangs = LANGUAGES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" placeholder="Search languages..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {filteredLangs.map(lang => (
            <button
              key={lang.code}
              onClick={() => { onSelect(lang); onClose(); }}
              className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-800 transition-colors ${selectedLang.code === lang.code ? 'bg-indigo-500/10 border border-indigo-500/50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className={`text-sm ${selectedLang.code === lang.code ? 'text-indigo-300 font-medium' : 'text-slate-300'}`}>
                  {lang.name}
                </span>
              </div>
              {selectedLang.code === lang.code && <Check className="w-4 h-4 text-indigo-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};