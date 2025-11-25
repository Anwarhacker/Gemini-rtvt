import React from "react";
import { Mic, MicOff, Plus, ChevronDown, RefreshCw } from "lucide-react";
import { Message, Language } from "../types";

interface ConversationViewProps {
  visibleMessages: Message[];
  conversationLangs: Language[];
  isListening: boolean;
  listeningLang: string | null;
  toggleListening: (lang?: string | null) => void;
  setActiveSelector: (selector: "source" | "target" | null) => void;
  setAddingConversationLang: (adding: boolean) => void;
  targetLang: Language;
  sourceLang: Language;
  clearHistory: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  visibleMessages,
  conversationLangs,
  isListening,
  listeningLang,
  toggleListening,
  setActiveSelector,
  setAddingConversationLang,
  targetLang,
  sourceLang,
  clearHistory,
}) => {
  const lastGuestMsg = [...visibleMessages]
    .reverse()
    .find((m) => m.speaker.includes("System"));
  const lastUserMsg = [...visibleMessages]
    .reverse()
    .find(
      (m) =>
        m.speaker === "User" ||
        (m.speaker === "System" && !m.speaker.includes("User"))
    );

  return (
    <div className="flex flex-col h-full rounded-b-3xl md:rounded-none overflow-hidden">
      <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center relative border-b border-slate-300 p-4">
        <div className="w-full h-full flex flex-col justify-center items-center">
          {lastGuestMsg ? (
            <div className="w-full flex items-center justify-start overflow-x-auto px-8 pb-4 gap-6 snap-x custom-scrollbar h-full">
              {(
                lastGuestMsg.translations || [
                  {
                    langCode: lastGuestMsg.lang,
                    langName: "Translation",
                    flag: "🌐",
                    text: lastGuestMsg.text,
                  },
                ]
              ).map((trans, idx) => (
                <div
                  key={idx}
                  className="snap-center shrink-0 min-w-[80%] max-w-[90%] flex flex-col items-center justify-center gap-4 p-6"
                >
                  <div className="flex items-center gap-3 opacity-70">
                    <span className="text-4xl">{trans.flag}</span>
                    <span className="text-xl text-slate-600 font-medium">
                      {trans.langName}
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-medium text-slate-900 leading-relaxed text-center break-words w-full">
                    {trans.text}
                  </p>
                </div>
              ))}
              <button
                onClick={() => setAddingConversationLang(true)}
                className="snap-center shrink-0 w-24 h-24 rounded-full border-2 border-dashed border-slate-400 flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-[#3182CE] hover:border-[#3182CE]/50 transition-all"
              >
                <Plus className="w-8 h-8" />
                <span className="text-xs font-medium">Add Lang</span>
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 max-w-lg px-4">
              <p className="text-lg sm:text-xl text-slate-700">
                Waiting for input...
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveSelector("target")}
          className="absolute top-4 left-4 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity z-10 p-2 rounded-lg hover:bg-white"
        >
          <span className="text-2xl sm:text-3xl">{targetLang.flag}</span>
          <div className="flex flex-col items-start">
            <span className="text-lg sm:text-xl text-slate-600">
              {targetLang.name}
            </span>
            <span className="text-[10px] text-[#3182CE] flex items-center gap-1">
              Change <ChevronDown className="w-3 h-3" />
            </span>
          </div>
        </button>

        <div className="absolute top-4 right-4 flex gap-3 z-20">
          <button
            onClick={clearHistory}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl bg-[#3182CE] hover:bg-[#2C7AB0] text-white border border-[#3182CE]/30"
            title="Reset History"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => toggleListening(conversationLangs[0].code)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              isListening && listeningLang === conversationLangs[0].code
                ? "bg-red-500 animate-pulse scale-110 shadow-red-500/50"
                : "bg-white hover:bg-slate-100 border border-slate-400"
            }`}
          >
            {isListening && listeningLang === conversationLangs[0].code ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-[#3182CE]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col items-center justify-center relative p-4">
        <button
          onClick={() => setActiveSelector("source")}
          className="absolute top-4 left-4 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity z-10 p-2 rounded-lg hover:bg-white"
        >
          <span className="text-2xl sm:text-3xl">{sourceLang.flag}</span>
          <div className="flex flex-col items-start">
            <span className="text-lg sm:text-xl text-slate-600">
              {sourceLang.name}
            </span>
            <span className="text-[10px] text-[#3182CE] flex items-center gap-1">
              Change <ChevronDown className="w-3 h-3" />
            </span>
          </div>
        </button>

        <div className="text-center space-y-4 max-w-lg w-full px-4">
          {lastGuestMsg?.text ? (
            <p className="text-2xl sm:text-3xl font-medium text-slate-900 leading-relaxed animate-in fade-in zoom-in duration-300">
              {lastGuestMsg.text}
            </p>
          ) : (
            <p className="text-lg sm:text-xl text-slate-700">
              Tap mic to speak...
            </p>
          )}
          {lastUserMsg?.text && (
            <p className="text-xs sm:text-sm text-slate-700 line-clamp-2">
              {lastUserMsg.text}
            </p>
          )}
        </div>

        <button
          onClick={() => toggleListening(sourceLang.code)}
          className={`absolute top-1/2 -translate-y-1/2 right-4 w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
            isListening && listeningLang === sourceLang.code
              ? "bg-red-500 animate-pulse scale-110 shadow-red-500/50"
              : "bg-[#3182CE] hover:bg-[#2C7AB0] border border-[#3182CE]/50"
          }`}
        >
          {isListening && listeningLang === sourceLang.code ? (
            <MicOff className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          ) : (
            <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};
