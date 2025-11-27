export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationItem {
  langCode: string;
  langName: string;
  flag: string;
  text: string;
}

export interface GrammarAnalysis {
  sentence: string;
  structure: string;
  words: Array<{
    word: string;
    pos: string;
    pronunciation: string;
    meaning: string;
  }>;
}

export interface DictionaryData {
  type: 'word' | 'sentence';
  source: string;
  phonetic?: string;
  definition?: string;
  translation?: string;
  examples?: string[];
  synonyms?: string[];
  breakdown?: Array<{ word: string; pos: string; meaning: string }>;
}

export interface Message {
  id: number;
  speaker: string;
  text: string;
  lang: string;
  timestamp: string;
  isTranslation?: boolean;
  correctedText?: string | null;
  image?: string | null;
  translation?: string;
  translations?: TranslationItem[];
  originalSource?: string;
  grammarAnalysis?: GrammarAnalysis;
  mode?: string;
  dictionaryData?: DictionaryData;
}

export interface ProcessingResult {
  original: string;
  corrected: string | null;
  translation: string;
  was_corrected: boolean;
}

// Augment window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}