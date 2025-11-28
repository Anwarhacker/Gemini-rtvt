import { GoogleGenAI } from "@google/genai";
import { ProcessingResult, DictionaryData, GrammarAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = result.split(';')[0].split(':')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper to create a WAV header for raw PCM data
const createWavHeader = (dataLength: number, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return buffer;
};

export const generateAudio = async (text: string): Promise<Blob> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { 
                role: 'user', 
                parts: [{ text }] 
            },
            config: {
                responseModalities: ["AUDIO"], 
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Puck' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned from API");

        // Decode base64 string to byte array
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create WAV file (Header + PCM Data)
        const wavHeader = createWavHeader(len);
        const wavBlob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
        return wavBlob;

    } catch (error) {
        console.error("Audio Generation Error:", error);
        throw error;
    }
};

export const processContent = async (
  text: string,
  imageFile: File | null,
  targetLangName: string,
  enableGrammarCheck: boolean
): Promise<ProcessingResult> => {
  let systemPrompt = "";
  let userParts: any[] = [];

  if (imageFile) {
    const { base64, mimeType } = await fileToBase64(imageFile);
    systemPrompt = `You are a fast visual translator. 
    1. Analyze the image. If text is found, translate to ${targetLangName}. If scene, describe in ${targetLangName}.
    
    Return JSON:
    {
        "translation": "String (The translation/description)",
        "corrected": null
    }`;

    userParts = [
      { text: text || "Analyze this image" },
      { inlineData: { mimeType: mimeType, data: base64 } },
    ];
  } else {
    systemPrompt = `You are a real-time translator.
    Target Language: ${targetLangName}.
    Grammar Check: ${enableGrammarCheck}.

    Return JSON:
    {
      "translation": "String (The translated text)",
      "corrected": "String | null" (Only if grammar check is ON and input had errors, provide corrected version. Else null)
    }`;
    userParts = [{ text: text }];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: userParts
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Empty response from AI");

    const parsed = JSON.parse(rawText);
    
    return {
      original: text, 
      corrected: parsed.corrected || null,
      translation: parsed.translation || "Translation Error",
      was_corrected: !!parsed.corrected && parsed.corrected !== text
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      original: text,
      corrected: null,
      translation: "Service Unavailable",
      was_corrected: false,
    };
  }
};

export const translateText = async (text: string, targetLangName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: `Translate the following text to ${targetLangName}. Output ONLY the translated text, no JSON, no preamble.\n\nText: "${text}"` }]
            }
        });
        if (!response.text) throw new Error("Empty translation response");
        return response.text.trim();
    } catch (error) {
        console.error("Simple Translation Error:", error);
        throw new Error(`Failed to translate to ${targetLangName}.`);
    }
};

export const explainGrammar = async (text: string): Promise<GrammarAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: `Analyze the grammatical structure of: "${text}".

        First, tokenize the sentence into individual words/phrases.
        For each word, provide ONE phonetic pronunciation using IPA notation.

        Return JSON with this exact schema:
        {
          "sentence": "${text}",
          "structure": "Brief description of sentence structure (e.g., Subject-Verb-Object, compound sentence, etc.)",
          "words": [
            {
              "word": "individual word or short phrase",
              "pos": "Part of Speech (Noun, Verb, Adjective, Adverb, Pronoun, Preposition, etc.)",
              "pronunciation": "Single IPA pronunciation (e.g., /wɜːrd/)",
              "meaning": "Brief meaning in context"
            }
          ]
        }

        IMPORTANT: Each word entry should have exactly ONE pronunciation, not multiple separated by commas.` }]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text;
    if (!rawText) throw new Error("Empty grammar response");

    const parsed = JSON.parse(rawText) as GrammarAnalysis;
    return parsed;

  } catch (error) {
    console.error("Grammar Analysis Error:", error);
    return {
      sentence: text,
      structure: "Analysis unavailable",
      words: []
    };
  }
};

export const lookupDictionary = async (text: string, targetLang: string): Promise<DictionaryData> => {
    const systemPrompt = `Act as a helpful dictionary and language learning assistant.
    Target Language for explanation: ${targetLang}.
    Input Text: "${text}"

    Instructions:
    1. Analyze if the Input Text is a single word/compound word OR a sentence/phrase.
    
    2. IF SINGLE WORD:
       - Provide the definition in ${targetLang}.
       - Provide phonetic pronunciation if available.
       - List up to 3 synonyms in ${targetLang}.
       - Provide 2 example sentences showing usage (with translations).
       - Set "type" to "word".

    3. IF SENTENCE/PHRASE:
       - Translate the full sentence to ${targetLang}.
       - Break down key words/tokens. For each token, give its Part of Speech (POS) and meaning in this context.
       - Set "type" to "sentence".

    Return strictly JSON matching this schema:
    {
      "type": "word" | "sentence",
      "source": "${text}",
      "phonetic": "String (optional)",
      "definition": "String (for words)",
      "translation": "String (for sentences)",
      "synonyms": ["String", "String"],
      "examples": ["String", "String"],
      "breakdown": [
         { "word": "String", "pos": "String", "meaning": "String" }
      ]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: text }]
            },
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json"
            }
        });

        const rawText = response.text;
        if (!rawText) throw new Error("Empty dictionary response");
        return JSON.parse(rawText) as DictionaryData;

    } catch (error) {
        console.error("Dictionary Error:", error);
        return {
            type: 'word',
            source: text,
            definition: "Could not retrieve dictionary data.",
        };
    }
};