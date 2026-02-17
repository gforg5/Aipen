
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    // CRITICAL: Initialize right before use to ensure process.env.API_KEY is latest
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Scale segments for 50-500 page range
    const chapterCount = Math.max(10, Math.min(50, Math.ceil(length / 7)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a professional ${genre} book titled "${title}". 
        Target length: ${length} pages. Structure exactly ${chapterCount} deep segments. 
        Each segment must have a high-impact title and 5 detailed sub-points. 
        Return strictly raw JSON array.`,
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
      if (!text) throw new Error("Neural blueprint empty.");
      
      const data = JSON.parse(text);
      return data.map((item: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: item.title,
        subsections: item.subsections,
        status: 'pending'
      }));
    } catch (e: any) {
      console.error("Outline Error:", e);
      throw new Error(`Architectural Error: ${e.message || "Unknown engine failure"}`);
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class professional author. Write an exhaustive, elite chapter for the book "${bookTitle}" (Genre: ${genre}). 
      Title: "${chapter.title}".
      Sub-points: ${chapter.subsections.join(', ')}. 
      
      RULES:
      1. Write massive, deep detail (aim for 2500+ words).
      2. Sophisticated, elite prose only.
      3. Insert [VISUAL: Description of a cinematic masterpiece illustration] where appropriate.
      4. Use ## for subheadings. 
      5. DO NOT repeat the chapter title. Start directly with the text.`,
      config: {
         thinkingConfig: { thinkingBudget: 32000 }
      }
    });

    return response.text || "Synthesis failed.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A professional book illustration for a ${genre} book: ${desc}. No text, cinematic lighting, 8k.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Visual core failed.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High-end book cover for "${title}". Genre: ${genre}. Award-winning design.` }] },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return [`data:image/png;base64,${part.inlineData.data}`];
      }
    } catch (e) { console.warn(e); }
    return [];
  }
};
