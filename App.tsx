import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Settings,
  Activity,
  Volume2,
  Users,
  Eye,
  MessageSquare,
  ArrowRightLeft,
  Download,
  Check,
  Copy,
  Wand2,
  CheckCircle2,
  Star,
  Trash2,
  Bookmark,
  RefreshCw,
  Gauge,
  SplitSquareVertical,
  Cpu,
  X,
  Languages,
  Menu,
  BookOpen,
  GraduationCap,
  Loader2,
  Library,
  ChevronDown,
  ChevronUp,
  Plus,
  Smartphone,
  ScanEye,
  AlertCircle,
} from "lucide-react";

import { LANGUAGES, MOCK_CONVERSATION } from "./constants";
import { Message, DictionaryData, TranslationItem, Language } from "./types";
import {
  processContent,
  explainGrammar,
  lookupDictionary,
  translateText,
  generateAudio,
} from "./services/geminiService";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { VisionUploader } from "./components/VisionUploader";
import { LanguageModal } from "./components/LanguageModal";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { copyToClipboard, cleanTranscript } from "./utils";
import { MobileNav } from "./components/MobileNav";
import { ProcessingState } from "./components/ProcessingState";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { GrammarModal } from "./components/GrammarModal";
import { DictionaryCard } from "./components/DictionaryCard";
import { ConversationView } from "./components/ConversationView";
import { MessageBubble } from "./components/MessageBubble";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [listeningLang, setListeningLang] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState("VOICE");
  const [messages, setMessages] = useState<Message[]>(MOCK_CONVERSATION);

  // Initialize from LocalStorage
  const [savedMessages, setSavedMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem("rtvt_saved_messages");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load saved messages", e);
      return [];
    }
  });

  const [inputInternal, setInputInternal] = useState("");
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]);

  // For Split View Multi-Language
  const [conversationLangs, setConversationLangs] = useState<Language[]>([
    LANGUAGES[1],
    LANGUAGES[2],
    LANGUAGES[3],
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSelector, setActiveSelector] = useState<
    "source" | "target" | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewState, setViewState] = useState("CHAT");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showLanguageControls, setShowLanguageControls] = useState(false);
  const [addingTranslationId, setAddingTranslationId] = useState<number | null>(
    null
  );
  const [addingConversationLang, setAddingConversationLang] = useState(false);

  const [isAddingTranslation, setIsAddingTranslation] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [showInputBar, setShowInputBar] = useState(false);

  // Grammar Analysis State
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [grammarModalData, setGrammarModalData] = useState<{
    text: string;
    analysis: string;
  } | null>(null);

  // Settings
  const [grammarCorrection, setGrammarCorrection] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>({
    prompt: () => {},
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<any>(null);
  const voiceBufferRef = useRef("");

  // Keep 3 languages in conversation view, with targetLang first
  useEffect(() => {
    setConversationLangs((prev) => {
      const defaultLangs = [LANGUAGES[1], LANGUAGES[2], LANGUAGES[3]];
      const newLangs = [
        targetLang,
        ...defaultLangs.filter((l) => l.code !== targetLang.code),
      ].slice(0, 3);
      return newLangs;
    });
  }, [targetLang]);

  useEffect(() => {
    localStorage.setItem("rtvt_saved_messages", JSON.stringify(savedMessages));
  }, [savedMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, error]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }
  }, []);

  useEffect(() => {
    if (isListening) setShowLanguageControls(false);
  }, [isListening]);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      window.speechSynthesis.cancel();
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleCopy = (text: string, id: number) => {
    if (copyToClipboard(text)) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleSave = (msg: Message) => {
    setSavedMessages((prev) => {
      const exists = prev.find((m) => m.id === msg.id);
      if (exists) return prev.filter((m) => m.id !== msg.id);
      return [...prev, msg];
    });
  };

  const handleGrammarAnalysis = async (
    textToAnalyze: string,
    msgId: number
  ) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    setError(null);

    if (msg.grammarAnalysis) {
      setGrammarModalData({
        text: textToAnalyze,
        analysis: msg.grammarAnalysis,
      });
      return;
    }

    setAnalyzingId(msgId);
    try {
      const analysis = await explainGrammar(textToAnalyze);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, grammarAnalysis: analysis } : m
        )
      );
      setGrammarModalData({ text: textToAnalyze, analysis });
    } catch (e: any) {
      setError(e.message || "Grammar analysis failed.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDownloadAudio = async (text: string, msgId: number) => {
    setError(null);
    setDownloadingId(msgId);
    try {
      const audioBlob = await generateAudio(text);
      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `translation-${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      console.error("Download failed", e);
      setError(e.message || "Failed to generate audio file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddTranslation = async (msgId: number, lang: any) => {
    setAddingTranslationId(null);
    setIsAddingTranslation(true);
    setError(null);

    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.originalSource) {
      setIsAddingTranslation(false);
      return;
    }

    try {
      const newTranslationText = await translateText(
        msg.originalSource,
        lang.name
      );
      const newTranslationItem: TranslationItem = {
        langCode: lang.code,
        langName: lang.name,
        flag: lang.flag,
        text: newTranslationText,
      };

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msgId) {
            const currentTranslations = m.translations || [];
            if (currentTranslations.some((t) => t.langCode === lang.code)) {
              return m;
            }
            return {
              ...m,
              translations: [...currentTranslations, newTranslationItem],
            };
          }
          return m;
        })
      );
    } catch (e: any) {
      setError(e.message || "Failed to add translation.");
    } finally {
      setIsAddingTranslation(false);
    }
  };

  const handleAddConversationLang = async (lang: Language) => {
    setAddingConversationLang(false);

    if (
      !conversationLangs.find((l) => l.code === lang.code) &&
      conversationLangs.length < 3
    ) {
      setConversationLangs((prev) => [...prev, lang]);
    }

    const visible = getVisibleMessages();
    const lastUserMsg = [...visible]
      .reverse()
      .find(
        (m) =>
          m.speaker === "User" ||
          (m.speaker === "System" && !m.speaker.includes("User"))
      );

    if (lastUserMsg) {
      const lastSystemMsg = [...visible]
        .reverse()
        .find((m) => m.speaker.includes("System (to User)"));
      if (lastSystemMsg && lastSystemMsg.originalSource) {
        handleAddTranslation(lastSystemMsg.id, lang);
      }
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        alert("App installed successfully!");
      }
    } else {
      alert(
        "PWA installation is not supported in this environment. Deploy to HTTPS for full PWA functionality."
      );
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      setMessages([]);
    }
  };

  const exportTranscript = () => {
    const transcript = messages
      .map((msg) => {
        const speaker =
          msg.speaker === "System"
            ? msg.isTranslation
              ? "Translation"
              : "AI"
            : msg.speaker;
        const time = msg.timestamp;
        const text =
          msg.text ||
          (msg.dictionaryData ? `Dictionary: ${msg.dictionaryData.word}` : "");
        return `[${time}] ${speaker}: ${text}`;
      })
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rtvt-transcript-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const speakText = async (
    text: string,
    langCode: string,
    onEndCallback?: () => void
  ) => {
    if (!text) return;
    setIsSpeaking(true);

    try {
      const audioBlob = await generateAudio(text);
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          if (onEndCallback) onEndCallback();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          if (onEndCallback) onEndCallback();
        };
        audio.play();
      } else {
        setIsSpeaking(false);
        if (onEndCallback) onEndCallback();
      }
    } catch (e) {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  };

  const toggleListening = (langOverride: string | null = null) => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setListeningLang(null);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        if (voiceBufferRef.current.trim().length > 0) {
          const cleanedBuffer = cleanTranscript(voiceBufferRef.current);
          const isTarget = langOverride && langOverride === targetLang.code;
          handleSend(cleanedBuffer, true, !!isTarget);
          voiceBufferRef.current = "";
        }
      }
    } else {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      voiceBufferRef.current = "";
      setInputInternal("");
      setError(null);

      try {
        const langToUse = langOverride || sourceLang.code;
        setListeningLang(langToUse);
        recognitionRef.current.lang = langToUse;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {}
        }, 100);
      }

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullText = cleanTranscript(
          finalTranscript +
            (finalTranscript && interimTranscript ? " " : "") +
            interimTranscript
        );
        setInputInternal(fullText);

        if (event.results[event.results.length - 1].isFinal) {
          if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = setTimeout(() => {
            const cleanedFinal = cleanTranscript(finalTranscript);
            const isTarget = recognitionRef.current.lang === targetLang.code;
            handleSend(cleanedFinal, true, isTarget);

            if (isListening) {
              recognitionRef.current.stop();
              setTimeout(() => {
                try {
                  if (isListening) recognitionRef.current.start();
                } catch (e) {}
              }, 150);
            }
            setInputInternal("");
          }, 1000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          setIsListening(false);
          setListeningLang(null);
          setError("Microphone access denied. Please allow permissions.");
        }
      };
    }
  };

  const handleSend = async (
    textOverride: string | null = null,
    isVoiceInput = false,
    isReverseTranslate = false
  ) => {
    const textToSend = textOverride || inputInternal;
    const hasImage = activeMode === "VISION" && selectedImage;

    if ((!textToSend || !textToSend.trim()) && !hasImage) return;

    if (isVoiceInput && isListening && autoSpeak) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsProcessing(true);
    setError(null);

    const userMsgId = Date.now();
    const currentMode = activeMode;

    const userMsg: Message = {
      id: userMsgId,
      speaker: "User",
      text: hasImage ? `[Analyzed Image] ${textToSend || ""}` : textToSend,
      lang: isReverseTranslate ? targetLang.code : sourceLang.code,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      image:
        hasImage && selectedImage ? URL.createObjectURL(selectedImage) : null,
      mode: currentMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInputInternal("");

    try {
      if (currentMode === "DICTIONARY") {
        const dictData = await lookupDictionary(textToSend, targetLang.name);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            speaker: "System",
            text: "",
            lang: targetLang.code,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            mode: currentMode,
            dictionaryData: dictData,
          },
        ]);
      } else {
        const outputLang = isReverseTranslate ? sourceLang : targetLang;
        const result = await processContent(
          textToSend,
          hasImage ? selectedImage : null,
          outputLang.name,
          grammarCorrection && !isReverseTranslate
        );

        if (hasImage) setSelectedImage(null);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? {
                  ...m,
                  correctedText:
                    result.was_corrected && !hasImage && !isReverseTranslate
                      ? result.corrected
                      : undefined,
                  translation: result.translation,
                }
              : m
          )
        );

        const translations: TranslationItem[] = [
          {
            langCode: outputLang.code,
            langName: outputLang.name,
            flag: outputLang.flag,
            text: result.translation,
          },
        ];

        if (!isReverseTranslate) {
          const otherLangs = conversationLangs.filter(
            (l) => l.code !== outputLang.code
          );
          const extraTranslations = await Promise.all(
            otherLangs.map(async (l) => {
              try {
                const txt = await translateText(
                  result.original || textToSend,
                  l.name
                );
                return {
                  langCode: l.code,
                  langName: l.name,
                  flag: l.flag,
                  text: txt,
                };
              } catch (e) {
                return null;
              }
            })
          );

          extraTranslations.forEach((t) => {
            if (t) translations.push(t);
          });
        }

        const aiMsg: Message = {
          id: Date.now() + 1,
          speaker: isReverseTranslate ? "System (to User)" : "System",
          text: result.translation,
          lang: outputLang.code,
          isTranslation: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mode: currentMode,
          originalSource: result.original || textToSend,
          translations: translations,
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (autoSpeak || isVoiceInput) {
          await speakText(result.translation, outputLang.code);
          if (isVoiceInput && isListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        } else if (isVoiceInput && isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }
    } catch (e: any) {
      console.error("Flow Error:", e);
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const switchLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const getVisibleMessages = () => {
    if (activeMode === "VISION") {
      return messages.filter((m) => m.mode === "VISION");
    }
    if (activeMode === "DICTIONARY") {
      return messages.filter((m) => m.mode === "DICTIONARY");
    }
    return messages.filter(
      (m) => m.mode !== "VISION" && m.mode !== "DICTIONARY"
    );
  };

  const visibleMessages = getVisibleMessages();

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans selection:bg-[#3182CE]/30 overflow-hidden">
      <LanguageModal
        isOpen={
          activeSelector !== null ||
          addingTranslationId !== null ||
          addingConversationLang
        }
        onClose={() => {
          setActiveSelector(null);
          setAddingTranslationId(null);
          setAddingConversationLang(false);
        }}
        title={
          addingConversationLang
            ? "Add Language to Split View"
            : addingTranslationId
            ? "Add Translation Language"
            : activeSelector === "source"
            ? "Select Input Language"
            : "Select Output Language"
        }
        selectedLang={
          addingConversationLang || addingTranslationId
            ? targetLang
            : activeSelector === "source"
            ? sourceLang
            : targetLang
        }
        onSelect={(lang) => {
          if (addingConversationLang) {
            handleAddConversationLang(lang);
          } else if (addingTranslationId) {
            handleAddTranslation(addingTranslationId, lang);
          } else if (activeSelector === "source") {
            setSourceLang(lang);
          } else {
            setTargetLang(lang);
          }
        }}
      />

      <GrammarModal
        isOpen={grammarModalData !== null}
        onClose={() => setGrammarModalData(null)}
        data={grammarModalData}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Config
            </h3>
            <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Auto-Grammar Fix</span>
                <button
                  onClick={() => setGrammarCorrection(!grammarCorrection)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    grammarCorrection ? "bg-[#3182CE]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                      grammarCorrection ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-700">Auto-Playback</span>
                <button
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    autoSpeak ? "bg-[#3182CE]" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${
                      autoSpeak ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
              <Gauge className="w-3 h-3" /> Audio Settings
            </h3>
            <div className="bg-white p-3 rounded-lg border border-slate-300 space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">
                    TTS Speed: {ttsSpeed}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={ttsSpeed}
                  onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                  className="w-full accent-[#3182CE] bg-slate-200 rounded-lg appearance-none h-2 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-300 space-y-2">
            <button
              onClick={clearHistory}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm rounded-lg transition-colors border border-red-300"
            >
              <Trash2 className="w-4 h-4" /> Clear History
            </button>
            <button
              onClick={exportTranscript}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-lg transition-colors border border-slate-400"
            >
              <Download className="w-4 h-4" /> Export Transcript
            </button>

            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm rounded-lg transition-all shadow-lg shadow-indigo-500/20 font-medium border border-indigo-500/50"
            >
              <Smartphone className="w-4 h-4" /> Install RTVT App
            </button>
          </div>
        </div>
      </SettingsDrawer>

      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#3182CE] backdrop-blur border-b border-slate-300 shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-[#3182CE]/20 transform rotate-3">
            <Activity className="text-[#3182CE] w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight leading-none text-white">
              RTVT{" "}
              <span className="text-[10px] sm:text-xs bg-white text-[#3182CE] px-1.5 rounded ml-1 align-top border border-white/20">
                ULTRA
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-white font-medium">
              Context-Aware Neural Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-white/50 rounded-full border border-slate-300/50 shadow-inner">
            <div className="flex items-center gap-2 text-[10px] font-mono text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              ONLINE
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors relative"
          >
            <Settings className="w-5 h-5 text-white/70 hover:text-white transition-colors" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-20 lg:w-64 flex-shrink-0 border-r border-slate-300 bg-white/50 flex-col backdrop-blur-sm">
          <nav className="flex-1 p-3 space-y-2">
            {[
              { id: "VOICE", icon: Mic, label: "Translate" },
              { id: "DICTIONARY", icon: Library, label: "Dictionary" },
              { id: "VISION", icon: Eye, label: "Image" },
              {
                id: "CONVERSATION",
                icon: SplitSquareVertical,
                label: "Split View",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setViewState("CHAT");
                }}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-200 group ${
                  activeMode === mode.id && viewState === "CHAT"
                    ? "bg-[#3182CE] text-white shadow-lg shadow-[#3182CE]/30 ring-1 ring-[#3182CE]/30"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
                title={mode.label}
              >
                <mode.icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    activeMode === mode.id
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                />
                <span className="hidden lg:block font-medium text-sm truncate">
                  {mode.label}
                </span>
              </button>
            ))}
            <div className="pt-4 border-t border-slate-300 mt-2 space-y-2">
              <button
                onClick={() => setViewState("SAVED")}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${
                  viewState === "SAVED"
                    ? "bg-yellow-200 text-yellow-700 border border-yellow-300"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Bookmark className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block font-medium text-sm truncate">
                  Saved Phrases
                </span>
              </button>

              <div className="pt-2 border-t border-slate-300 space-y-2">
                <button
                  onClick={clearHistory}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 transition-colors border border-red-300"
                >
                  <Trash2 className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:block font-medium text-sm truncate">
                    Clear History
                  </span>
                </button>
                <button
                  onClick={exportTranscript}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors border border-slate-400"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  <span className="hidden lg:block font-medium text-sm truncate">
                    Export Transcript
                  </span>
                </button>

                <button
                  onClick={handleInstallApp}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl bg-gradient-to-r from-[#3182CE] to-[#2573A7] hover:from-[#2C7AB0] hover:to-[#216A94] text-white transition-all shadow-lg shadow-[#3182CE]/20 font-medium border border-[#3182CE]/50"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden lg:block font-medium text-sm truncate">
                    Install RTVT App
                  </span>
                </button>
              </div>
            </div>
          </nav>
        </aside>

        <section className="flex-1 flex flex-col relative w-full h-full">
          {activeMode === "CONVERSATION" && viewState === "CHAT" ? (
            <ErrorBoundary>
              <ConversationView
                visibleMessages={visibleMessages}
                conversationLangs={conversationLangs}
                isListening={isListening}
                listeningLang={listeningLang}
                toggleListening={toggleListening}
                setActiveSelector={setActiveSelector}
                setAddingConversationLang={setAddingConversationLang}
                targetLang={targetLang}
                sourceLang={sourceLang}
                clearHistory={clearHistory}
              />
            </ErrorBoundary>
          ) : (
            <>
              {viewState === "CHAT" && (
                <>
                  {/* Vision Mode Layout - Separate Tab */}
                  {activeMode === "VISION" && (
                    <div className="flex-1 flex flex-col h-full bg-white">
                      {/* Static Header / Uploader for Vision */}
                      <div className="w-full bg-slate-100 border-b border-slate-300 z-10 p-4">
                        <VisionUploader
                          onImageSelect={setSelectedImage}
                          selectedImage={selectedImage}
                          clearImage={() => setSelectedImage(null)}
                        />
                      </div>

                      {/* Messages List - Specific to Vision context */}
                      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 sm:space-y-8 scroll-smooth pb-32 sm:pb-40">
                        <div className="text-center py-4">
                          <span className="text-[10px] sm:text-xs font-mono text-slate-700 bg-white border border-slate-300 px-3 py-1 rounded-full shadow-sm">
                            Vision Mode Active
                          </span>
                        </div>

                        {visibleMessages.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isSaved={savedMessages.some((m) => m.id === msg.id)}
                            savedMessages={savedMessages}
                            setSavedMessages={setSavedMessages}
                            handleToggleSave={handleToggleSave}
                            handleDelete={handleDelete}
                            handleGrammarAnalysis={handleGrammarAnalysis}
                            analyzingId={analyzingId}
                            handleCopy={handleCopy}
                            copiedId={copiedId}
                            handleDownloadAudio={handleDownloadAudio}
                            downloadingId={downloadingId}
                            speakText={speakText}
                            setAddingTranslationId={setAddingTranslationId}
                          />
                        ))}

                        {isProcessing && (
                          <div className="flex gap-4 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center shrink-0">
                              <Activity className="w-4 h-4 text-[#3182CE] animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-300">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3182CE]" />
                              <span className="animate-pulse">
                                Analyzing Image & Context...
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </div>
                  )}

                  {/* Standard Mode Layout (Translation, Dictionary, Sign) */}
                  {activeMode !== "VISION" && (
                    <div className="flex-1 overflow-y-auto  p-3 sm:p-6 space-y-6 sm:space-y-8 scroll-smooth ">
                      <div className="text-center py-6">
                        <span className="text-[10px] sm:text-xs font-mono text-slate-600 bg-slate-100 border border-slate-300 px-4 py-1.5 rounded-full shadow-sm">
                          {new Date().toLocaleDateString()} •{" "}
                          {activeMode === "DICTIONARY"
                            ? "Dictionary Lookup"
                            : "Translation Session"}
                        </span>
                      </div>

                      {visibleMessages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isSaved={savedMessages.some((m) => m.id === msg.id)}
                          savedMessages={savedMessages}
                          setSavedMessages={setSavedMessages}
                          handleToggleSave={handleToggleSave}
                          handleDelete={handleDelete}
                          handleGrammarAnalysis={handleGrammarAnalysis}
                          analyzingId={analyzingId}
                          handleCopy={handleCopy}
                          copiedId={copiedId}
                          handleDownloadAudio={handleDownloadAudio}
                          downloadingId={downloadingId}
                          speakText={speakText}
                          setAddingTranslationId={setAddingTranslationId}
                        />
                      ))}

                      {isProcessing && (
                        <div className="flex gap-4 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-400 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4 text-[#3182CE] animate-pulse" />
                          </div>
                          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-300">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3182CE]" />
                            <span className="animate-pulse">
                              {activeMode === "DICTIONARY"
                                ? "Searching Dictionary..."
                                : grammarCorrection
                                ? "Improving & Translating..."
                                : "Translating..."}
                            </span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </>
              )}

              {viewState === "SAVED" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                  <h2 className="text-xl font-bold text-yellow-700 flex items-center gap-2 mb-6 px-2">
                    <Bookmark className="w-6 h-6" /> Saved Translations
                  </h2>
                  {savedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-700 gap-4">
                      <Star className="w-12 h-12 opacity-20" />
                      <p>No saved phrases yet.</p>
                    </div>
                  ) : (
                    savedMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isSaved={savedMessages.some((m) => m.id === msg.id)}
                        savedMessages={savedMessages}
                        setSavedMessages={setSavedMessages}
                        handleToggleSave={handleToggleSave}
                        handleDelete={handleDelete}
                        handleGrammarAnalysis={handleGrammarAnalysis}
                        analyzingId={analyzingId}
                        handleCopy={handleCopy}
                        copiedId={copiedId}
                        handleDownloadAudio={handleDownloadAudio}
                        downloadingId={downloadingId}
                        speakText={speakText}
                        setAddingTranslationId={setAddingTranslationId}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Floating Toggle Button when Input Bar is Hidden */}
              {viewState === "CHAT" && !showInputBar && (
                <button
                  onClick={() => setShowInputBar(true)}
                  className="fixed bottom-20 md:bottom-4 right-4 p-3 bg-slate-900/90 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-indigo-500 transition-colors z-50"
                  title="Show Input Bar"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              )}

              {/* Input Area */}
              {viewState === "CHAT" && showInputBar && (
                <div className="w-full fixed bottom-20 md:bottom-4 p-3 sm:p-6 z-20">
                  <div className="max-w-3xl mx-auto relative">
                    {/* Conditional Language Selectors Popup */}
                    {showLanguageControls && (
                      <div className="absolute bottom-full left-0 right-0 z-30  animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200">
                        <div className="flex items-center justify-between bg-slate-900/95 backdrop-blur-xl p-1.5 rounded-2xl border border-[#3182CE] text-white max-w-sm mx-auto w-full shadow-2xl ring-1 ring-black/50">
                          <button
                            onClick={() => setActiveSelector("source")}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors min-w-0 group"
                          >
                            <span className="text-xl grayscale group-hover:grayscale-0 transition-all">
                              {sourceLang.flag}
                            </span>
                            <span className="font-medium text-slate-300 truncate text-xs sm:text-sm">
                              {sourceLang.name.split(" ")[0]}
                            </span>
                          </button>
                          <button
                            onClick={switchLanguages}
                            className="p-2 rounded-full hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 transition-all hover:rotate-180 shrink-0"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveSelector("target")}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors min-w-0 group"
                          >
                            <span className="text-xl grayscale group-hover:grayscale-0 transition-all">
                              {targetLang.flag}
                            </span>
                            <span className="font-medium text-slate-300 truncate text-xs sm:text-sm">
                              {targetLang.name.split(" ")[0]}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Main Input Bar */}
                    <div className="relative group">
                      <div
                        className={`flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-[20px] border transition-all duration-300 ${
                          isListening
                            ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20"
                            : "border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 shadow-xl"
                        }`}
                      >
                        {/* Left Icon (Visualizer or Language Toggle) */}
                        <div className="pl-1 sm:pl-2 shrink-0">
                          {isListening ? (
                            <div className="w-8 h-8 bg-red-700 sm:w-10 flex items-center justify-center">
                              <AudioVisualizer isActive={true} />
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setShowLanguageControls(!showLanguageControls)
                              }
                              className={`p-2 sm:px-3 sm:py-2 transition-all border border-white/20 duration-200 rounded-full flex items-center gap-2 ${
                                showLanguageControls
                                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                                  : "text-slate-400 hover:text-indigo-400 bg-indigo-500/10"
                              }`}
                            >
                              <Languages className="w-5 h-5" />
                              {!showLanguageControls && (
                                <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium border-l border-slate-700 pl-2 ml-1 opacity-70">
                                  <span className="grayscale">
                                    {sourceLang.flag}
                                  </span>
                                  <span className="text-slate-500">→</span>
                                  <span className="grayscale">
                                    {targetLang.flag}
                                  </span>
                                </div>
                              )}
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={inputInternal}
                          onChange={(e) => setInputInternal(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          placeholder={
                            activeMode === "VISION"
                              ? "Describe this image..."
                              : activeMode === "DICTIONARY"
                              ? "Enter a word or sentence..."
                              : isListening
                              ? "Listening..."
                              : "type or speak..."
                          }
                          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 h-10 sm:h-12 text-sm sm:text-base min-w-0 font-medium"
                          disabled={isListening}
                        />

                        {/* Right Actions */}
                        <div className="flex items-center gap-1.5 pr-1 shrink-0">
                          <button
                            onClick={() => setShowInputBar(!showInputBar)}
                            className={`p-2.5 rounded-xl transition-all ${
                              showInputBar
                                ? "text-indigo-300 bg-indigo-500/20 ring-1 ring-indigo-500/30"
                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                            }`}
                            title={
                              showInputBar ? "Hide Input Bar" : "Show Input Bar"
                            }
                          >
                            <ChevronDown
                              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                                showInputBar ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {/* {activeMode !== "DICTIONARY" && (
                            <button
                              onClick={() =>
                                setGrammarCorrection(!grammarCorrection)
                              }
                              className={`p-2.5 rounded-xl transition-all ${
                                grammarCorrection
                                  ? "text-indigo-300 bg-indigo-500/20 ring-1 ring-indigo-500/30"
                                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                              }`}
                              title="Toggle AI Grammar Fix"
                            >
                              <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          )} */}

                          <div className="w-px h-6 bg-slate-700/50 mx-1" />

                          <button
                            onClick={() => toggleListening()}
                            className={`p-3 sm:p-3.5 rounded-xl transition-all duration-300 shadow-lg ${
                              isListening
                                ? "bg-red-500 text-white hover:bg-red-600 scale-105 shadow-red-500/30"
                                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 hover:scale-105"
                            }`}
                          >
                            {isListening ? (
                              <MicOff className="w-5 h-5" />
                            ) : (
                              <Mic className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile Navigation Bar */}
      {viewState !== "CONVERSATION" && (
        <MobileNav
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          setViewState={setViewState}
        />
      )}
    </div>
  );
}
