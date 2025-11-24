import { GoogleGenAI } from "@google/genai";
import { ProcessingResult, DictionaryData } from "../types";

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

export const explainGrammar = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: [{ text: `Analyze the grammatical structure of: "${text}". 
        
        Provide a concise breakdown of the Parts of Speech (POS) for key words and briefly explain the sentence structure. 
        Format the output clearly with bullet points or a simple list.` }]
      }
    });
    return response.text || "Could not analyze grammar.";
  } catch (error) {
    console.error("Grammar Analysis Error:", error);
    return "Analysis unavailable.";
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