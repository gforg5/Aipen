
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    const ai = getAI();
    const chapterCount = Math.max(5, Math.min(30, Math.ceil(length / 10)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a detailed professional book outline for a ${genre} book titled "${title}". 
        Target total book length: ${length} pages. Provide exactly ${chapterCount} chapters. 
        For each chapter, provide a title and 3-5 distinct subsections. Return raw JSON array only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subsections: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                }
              },
              required: ["title", "subsections"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Neural blueprint returned empty.");
      
      const data = JSON.parse(text);
      return data.map((item: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: item.title,
        subsections: item.subsections,
        status: 'pending'
      }));
    } catch (e: any) {
      if (e.message === "MISSING_API_KEY") throw e;
      console.error("Outline Generation Failure:", e);
      throw new Error(`Architectural failure: ${e.message || "Unknown engine error"}`);
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = getAI();
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class professional author. Write high-fidelity, comprehensive content for Chapter: "${chapter.title}" 
      of the book "${bookTitle}" (Genre: ${genre}). 
      Discuss topics: ${chapter.subsections.join(', ')}. 
      
      RULES:
      1. Use a rich, elite literary style.
      2. Insert [VISUAL: Description of illustration] placeholders where visual context adds value.
      3. Write a deep, detailed segment (at least 1500 words) with multiple paragraphs and sub-headings.
      4. Professional markdown formatting (use ## for subheadings).
      5. Ensure elite flow and sophisticated vocabulary.
      6. DO NOT repeat the chapter title at the start. Just start with the prose or a subheading.`,
      config: {
         thinkingConfig: { thinkingBudget: 16000 }
      }
    });

    return response.text || "Neural core failed to materialize content.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = getAI();
    const prompt = `A professional, highly aesthetic book illustration for a ${genre} book. Subject: ${desc}. Elite visual quality, no text, cinematic lighting.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Visual materialization failed.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = getAI();
    const covers: string[] = [];
    const prompt = `A premium high-fidelity book cover for "${title}". Genre: ${genre}. Highly artistic, Amazon KDP ready, minimal text.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "3:4" }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          covers.push(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      console.warn("Cover gen latency:", e);
    }
    return covers;
  }
};
