import React from "react";
import { GraduationCap, X } from "lucide-react";
import { GrammarAnalysis } from "../types";

export const GrammarModal = ({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: { text: string; analysis: GrammarAnalysis } | null;
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-200">Grammar Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-semibold">
              Source Text
            </p>
            <p className="text-lg text-slate-200 font-medium">{data.text}</p>
          </div>

          <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">
              Sentence Structure
            </p>
            <p className="text-slate-300">{data.analysis.structure}</p>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">
                Word Analysis
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Word
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Part of Speech
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Pronunciation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.analysis.words.map((word, index) => (
                    <tr key={index} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">
                        {word.word}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {word.pos}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                        {word.pronunciation}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {word.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
