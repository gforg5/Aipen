
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Adjust chapter count based on target page length to simulate a larger book structure
    const chapterCount = Math.max(8, Math.min(40, Math.ceil(length / 8)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a comprehensive, high-fidelity book outline for a ${genre} masterpiece titled "${title}". 
        The target book length is ${length} pages. Create a professional structure with exactly ${chapterCount} chapters. 
        Each chapter must have a compelling title and 4-6 detailed subsections covering key themes and narrative arcs. 
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
        model: 'gemini-3-pro-preview', 
        contents: `You are a world-renowned professional author. Write an exhaustive, elite chapter for the book "${bookTitle}" (Genre: ${genre}). 
        Chapter Title: "${chapter.title}".
        Key Sub-topics to integrate: ${chapter.subsections.join(', ')}. 
        
        LITERARY DIRECTIVES:
        1. Employ a sophisticated, immersive writing style with rich vocabulary.
        2. Aim for extreme depth and detail (minimum 1500 words for this segment).
        3. Use professional markdown formatting (## for subheadings, *italic* for emphasis).
        4. Place [VISUAL: Vivid description of a cinematic illustration] where it enhances the narrative.
        5. Ensure seamless transitions between concepts.
        6. Start directly with the prose. Do not repeat the chapter title.`,
        config: {
           thinkingConfig: { thinkingBudget: 32000 }
        }
      });

      return response.text || "Neural core failed to synthesize content.";
    } catch (e: any) {
      console.error("Chapter Generation Error:", e);
      throw e;
    }
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Professional high-end book illustration for a ${genre} volume. Scene: ${desc}. Cinematic lighting, artistic mastery, ultra-detailed, 8k resolution, no text.`;
    
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
    const prompt = `Premium minimalist book cover art for "${title}". Genre: ${genre}. Award-winning design, evocative imagery, Amazon KDP standard, no text on art.`;
    
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
      console.warn("Cover generation failed:", e);
    }
    return [];
  }
};
