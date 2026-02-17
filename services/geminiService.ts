
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    // CRITICAL: SDK must be initialized with the key provided in the environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // Scale segments for 50-500 page range to ensure "bulk"
    const chapterCount = Math.max(12, Math.min(65, Math.ceil(length / 7)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a professional, multi-volume caliber ${genre} book titled "${title}". 
        Target length: ${length} pages. Structure exactly ${chapterCount} deep segments. 
        Each segment needs a technical title and 6 detailed sub-points to ensure massive content breadth. 
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
      if (!text) throw new Error("Neural blueprint returned empty.");
      
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class professional author. Write an exhaustive, elite chapter for the book "${bookTitle}" (Genre: ${genre}). 
      Segment Title: "${chapter.title}".
      Areas of analysis: ${chapter.subsections.join(', ')}. 
      
      LITERARY STANDARDS:
      1. Write massive, deep detail (aim for 3000+ words to fill pages).
      2. Employ sophisticated, elite prose with rich vocabulary.
      3. Use professional markdown (## for subheadings, *italic* for emphasis).
      4. Place [VISUAL: Description of a cinematic illustration] where it enhances the narrative.
      5. Start directly with the text. DO NOT repeat the segment title.`,
      config: {
         thinkingConfig: { thinkingBudget: 32000 }
      }
    });

    return response.text || "Synthesis failed.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A professional book illustration for a ${genre} volume: ${desc}. Cinematic lighting, 8k resolution, no text.` }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Visual core failed.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Premium book cover for "${title}". Genre: ${genre}. Elegant design.` }] },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return [`data:image/png;base64,${part.inlineData.data}`];
      }
    } catch (e) { console.warn(e); }
    return [];
  }
};
