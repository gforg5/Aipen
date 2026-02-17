
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing. Please ensure the environment is configured correctly.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Scale chapter count to reach the target "page" feel (1 chapter ~ 5-10 pages)
    const chapterCount = Math.max(10, Math.min(60, Math.ceil(length / 8)));
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Architect a professional, deep-dive ${genre} book titled "${title}". 
        The target volume is ${length} pages. Structure exactly ${chapterCount} comprehensive segments (chapters). 
        For each segment, provide a high-fidelity title and 6 detailed sub-sections that ensure the content has massive breadth and technical depth. 
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
      if (!text) throw new Error("Neural core returned empty architecture.");
      
      const data = JSON.parse(text);
      return data.map((item: any, index: number) => ({
        id: `ch-${index}-${Date.now()}`,
        title: item.title,
        subsections: item.subsections,
        status: 'pending'
      }));
    } catch (e: any) {
      console.error("Outline Generation Error:", e);
      throw new Error(`Architectural failure: ${e.message || "Unknown error"}`);
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a legendary professional author specializing in ${genre}. 
      Write a massive, comprehensive manuscript segment for the book "${bookTitle}". 
      Segment Title: "${chapter.title}".
      Key Areas to cover in extreme detail: ${chapter.subsections.join(', ')}. 
      
      CORE DIRECTIVES:
      1. Use elite, sophisticated, and evocative prose. 
      2. This segment must be incredibly long and detailed (target 3000+ words). Use multiple paragraphs, sub-headings, and deep analysis.
      3. Use professional markdown (## for subheadings, *italic* for nuance).
      4. Strategically place [VISUAL: Description of a cinematic, high-art masterpiece illustration] to enhance the reader's journey.
      5. DO NOT repeat the segment title at the beginning. Start immediately with the prose.`,
      config: {
         thinkingConfig: { thinkingBudget: 32000 }
      }
    });

    return response.text || "Neural core failed to synthesize content.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const prompt = `Premium aesthetic book illustration for a ${genre} volume. Scene: ${desc}. Elite visual quality, no text, cinematic lighting, ultra-detailed, 8k.`;
    
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
    throw new Error("Visual core failed to materialize image.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const apiKey = process.env.API_KEY;
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    const prompt = `Award-winning minimalist book cover art for "${title}". Genre: ${genre}. Highly evocative, high-fidelity imagery, Amazon KDP ready, no text.`;
    
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
      console.warn("Cover synthesis latency:", e);
    }
    return [];
  }
};
