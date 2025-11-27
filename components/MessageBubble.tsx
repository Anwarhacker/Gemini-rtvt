import React from "react";
import {
  Volume2,
  Download,
  Trash2,
  Star,
  BookOpen,
  Copy,
  Check,
  Loader2,
  X,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Message } from "../types";
import { DictionaryCard } from "./DictionaryCard";

interface MessageBubbleProps {
  msg: Message;
  isSaved: boolean;
  savedMessages: Message[];
  setSavedMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  handleToggleSave: (msg: Message) => void;
  handleDelete: (id: number) => void;
  handleGrammarAnalysis: (text: string, msgId: number) => void;
  analyzingId: number | null;
  handleCopy: (text: string, id: number) => void;
  copiedId: number | null;
  handleDownloadAudio: (text: string, msgId: number) => void;
  downloadingId: number | null;
  speakText: (
    text: string,
    langCode: string,
    onEndCallback?: () => void
  ) => void;
  setAddingTranslationId: React.Dispatch<React.SetStateAction<number | null>>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  msg,
  isSaved,
  savedMessages,
  setSavedMessages,
  handleToggleSave,
  handleDelete,
  handleGrammarAnalysis,
  analyzingId,
  handleCopy,
  copiedId,
  handleDownloadAudio,
  downloadingId,
  speakText,
  setAddingTranslationId,
}) => {
  if (msg.dictionaryData) {
    return <DictionaryCard data={msg.dictionaryData} />;
  }

  const isSystem = msg.speaker === "System" || msg.speaker.includes("System");
  const isRightAlign = !isSystem;

  if (!isSystem) {
    return (
      <div className={`flex gap-2 sm:gap-4 w-full flex-row-reverse`}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 shadow-lg ring-2 ring-offset-2 ring-white bg-indigo-500 ring-white">
          U
        </div>
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
          <div className="flex items-center gap-2 mb-1">
            {msg.lang && (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-400 uppercase tracking-wider">
                {msg.lang.split("-")[0]}
              </span>
            )}
          </div>
          <div className="p-2 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm break-words w-full  relative group transition-all duration-300 bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/50">
            {msg.image && (
              <div className="mb-3 w-full rounded-lg overflow-hidden border border-white/10 shadow-inner bg-black/20">
                <img
                  src={msg.image}
                  alt="User Upload"
                  className=" h-auto mx-auto"
                />
              </div>
            )}
            {msg.correctedText && (
              <div className="mb-2 pb-2 border-b border-white/20">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70 mb-1">
                  <X className="w-3 h-3" /> Original
                </div>
                {/* <span className="line-through opacity-60 block decoration-red-400/50">{msg.text}</span> */}
                <div className="flex items-center gap-1 text-[10px] text-emerald-300 uppercase tracking-wider mt-2 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Corrected
                </div>
              </div>
            )}
            <div className="whitespace-pre-wrap">
              {msg.correctedText ? msg.correctedText : msg.text}
            </div>
          </div>
          <div className="flex gap-2 mt-1 px-1 justify-end">
            <button
              onClick={() => speakText(msg.correctedText || msg.text, msg.lang)}
              className="text-slate-500 hover:text-indigo-400 p-1 transition-colors"
              title="Play TTS"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                handleDownloadAudio(msg.correctedText || msg.text, msg.id)
              }
              className="text-slate-500 hover:text-emerald-400 p-1 transition-colors"
              title="Download Audio"
            >
              {downloadingId === msg.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => handleDelete(msg.id)}
              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-4 w-full flex-row">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs  text-white font-bold shrink-0 shadow-lg ring-2 ring-offset-2 ring-white bg-purple-500 ">
        R.
      </div>

      <div className="flex flex-col items-start w-full overflow-hidden">
        <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 w-full custom-scrollbar pr-4">
          {(
            msg.translations || [
              {
                langCode: msg.lang,
                langName: "Translation",
                flag: "🌐",
                text: msg.text,
              },
            ]
          ).map((trans, idx) => (
            <div
              key={idx}
              className="min-w-[260px] sm:min-w-[300px] max-w-[300px] bg-white rounded-xl border border-slate-300 p-4 flex flex-col shadow-lg relative group shrink-0"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{trans.flag}</span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {trans.langName}
                  </span>
                </div>
                <button
                  onClick={() => speakText(trans.text, trans.langCode)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-600 hover:text-[#3182CE] transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap flex-1">
                {trans.text}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-300/50">
                <button
                  onClick={() => handleGrammarAnalysis(trans.text, msg.id)}
                  className="p-1.5 text-slate-600 hover:text-[#3182CE] transition-colors"
                  title="Analyze"
                >
                  {analyzingId === msg.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy(trans.text, msg.id)}
                  className="p-1.5 text-slate-600 hover:text-emerald-400 transition-colors"
                  title="Copy"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDownloadAudio(trans.text, msg.id)}
                  className="p-1.5 text-slate-600 hover:text-[#3182CE] transition-colors"
                  title="Download Audio"
                >
                  {downloadingId === msg.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setAddingTranslationId(msg.id)}
            className="min-w-[60px] w-[60px] bg-slate-100 rounded-xl border-2 border-dashed border-slate-400 flex items-center justify-center hover:bg-slate-200 hover:border-[#3182CE]/50 transition-all group shrink-0"
            title="Add another language"
          >
            <Plus className="w-6 h-6 text-slate-600 group-hover:text-[#3182CE] transition-colors" />
          </button>
        </div>

        <div className="flex gap-2 mt-1 px-1  opacity-50 hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleToggleSave(msg)}
            className={`p-1 transition-colors ${
              isSaved
                ? "text-yellow-400"
                : "text-slate-500 hover:text-yellow-400"
            }`}
            title="Save to Favorites"
          >
            <Star
              className="w-3.5 text-yellow-500 h-3.5"
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={() => handleDelete(msg.id)}
            className="text-red-500 hover:text-red-400 p-1 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
