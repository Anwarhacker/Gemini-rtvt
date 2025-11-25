import React from 'react';
import { DictionaryData } from '../types';

export const DictionaryCard = ({ data }: { data: DictionaryData }) => {
    return (
        <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-2xl font-bold text-white tracking-tight">{data.source}</h3>
                    {data.phonetic && <span className="text-slate-400 font-mono text-sm">/{data.phonetic}/</span>}
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{data.type}</span>
                </div>
                {data.definition && <p className="text-indigo-300 text-lg leading-relaxed">{data.definition}</p>}
                {data.translation && <p className="text-emerald-400 text-lg leading-relaxed font-medium">{data.translation}</p>}
            </div>

            <div className="space-y-6">
                {data.breakdown && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Breakdown</h4>
                        <div className="grid gap-2">
                            {data.breakdown.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-slate-200">{item.word}</span>
                                        <span className="text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{item.pos}</span>
                                    </div>
                                    <span className="text-slate-400 italic text-sm">{item.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.examples && data.examples.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Examples</h4>
                        <ul className="space-y-2">
                            {data.examples.map((ex, i) => (
                                <li key={i} className="text-slate-300 text-sm pl-4 border-l-2 border-slate-700 italic">
                                    "{ex}"
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {data.synonyms && data.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {data.synonyms.map((syn, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 hover:border-slate-600 transition-colors">
                                {syn}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};