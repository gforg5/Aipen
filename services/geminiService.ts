
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, pages: number): Promise<Chapter[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Scale chapters: 50 pages -> 10 chapters, 500 pages -> 80 chapters
    const chapterCount = Math.max(10, Math.min(80, Math.ceil(pages / 6)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a massive, high-fidelity book blueprint for a ${genre} masterpiece titled "${title}". 
        The target book length is ${pages} pages. Create a professional structure with exactly ${chapterCount} chapters. 
        Each chapter must have a compelling title and 5 detailed subsections covering unique narrative arcs or concepts. 
        Return strictly raw JSON array matching the schema.`,
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
      if (!text) throw new Error("Neural core returned empty blueprint.");
      
      const data = JSON.parse(text);
      return data.map((item: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: item.title,
        subsections: item.subsections,
        status: 'pending'
      }));
    } catch (e: any) {
      console.error("Outline Generation Error:", e);
      throw e;
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `You are a world-renowned author. Write an exhaustive, elite chapter for the book "${bookTitle}" (Genre: ${genre}). 
        Chapter Title: "${chapter.title}".
        Sub-topics to integrate deeply: ${chapter.subsections.join(', ')}. 
        
        LITERARY DIRECTIVES:
        1. Employ a sophisticated, immersive writing style.
        2. Aim for maximum depth (approx 2000 words).
        3. Use professional markdown formatting (## for subheadings).
        4. Place [VISUAL: Vivid cinematic description] where a full-page illustration should go.
        5. Start directly with the prose.`,
        config: {
           thinkingConfig: { thinkingBudget: 16000 }
        }
      });

      return response.text || "Synthesis failure.";
    } catch (e: any) {
      console.error("Chapter Generation Error:", e);
      throw e;
    }
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Professional high-end book illustration. Genre: ${genre}. Scene: ${desc}. Cinematic lighting, 8k resolution, no text.`;
    
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
    throw new Error("Visual synthesis failed.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Premium minimalist book cover art for "${title}". Genre: ${genre}. No text on art.`;
    
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
          return [`data:image/png;base64,${part.inlineData.data}`];
        }
      }
    } catch (e) {
      return [];
    }
    return [];
  }
};
