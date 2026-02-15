import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    // Initializing right before the call to ensure fresh API key context
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chapterCount = Math.max(5, Math.min(30, Math.ceil(length / 10)));
    
    // Switch to gemini-3-flash-preview for the blueprint phase to avoid timeouts
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a detailed professional book outline for a ${genre} book titled "${title}". 
      Target length: ${length} pages. Exactly ${chapterCount} chapters. 
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

    let jsonStr = response.text.trim();
    // Clean markdown blocks if present
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1].trim();
    }

    try {
      const data = JSON.parse(jsonStr);
      return data.map((item: any, index: number) => ({
        id: `ch-${index}`,
        title: item.title,
        subsections: item.subsections,
        status: 'pending'
      }));
    } catch (e) {
      console.error("JSON Parse Failure:", jsonStr);
      throw new Error("Neural blueprint parsing failed.");
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Using gemini-3-pro-preview for world-class narrative synthesis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a world-class professional author. Write high-fidelity, comprehensive content for Chapter: "${chapter.title}" 
      of the book "${bookTitle}" (Genre: ${genre}). 
      Discuss topics: ${chapter.subsections.join(', ')}. 
      
      RULES:
      1. Rich, elite literary style.
      2. Insert [VISUAL: Description of illustration] placeholders where appropriate.
      3. Write at least 800 words for this segment to ensure depth.
      4. Professional markdown formatting.`,
      config: {
        thinkingConfig: { thinkingBudget: 12000 } // High reasoning for depth
      }
    });

    return response.text || "Neural core failed to materialize content.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A professional, highly aesthetic book illustration for a ${genre} book. Subject: ${desc}. Elite visual quality, no text.`;
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const covers: string[] = [];
    const prompt = `A premium high-fidelity book cover for "${title}". Genre: ${genre}. Highly artistic, Amazon KDP ready.`;
    
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