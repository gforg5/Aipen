import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chapterCount = Math.max(5, Math.min(30, Math.ceil(length / 10)));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is faster for JSON structures
      contents: `Generate a professional book outline for a ${genre} book titled "${title}". 
      The book should be approximately ${length} pages long. Provide exactly ${chapterCount} chapters. 
      Each chapter should have a title and a list of 3-5 sub-topics. Return ONLY raw JSON.`,
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
    // Robustly handle cases where model might wrap JSON in markdown blocks
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1];
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
      console.error("Failed to parse outline JSON:", jsonStr);
      throw new Error("Blueprint parsing failed.");
    }
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro for high quality writing
      contents: `You are a world-class professional author. Write the full, detailed content for Chapter: "${chapter.title}" 
      of the book "${bookTitle}" (Genre: ${genre}). 
      Include these topics: ${chapter.subsections.join(', ')}. 
      
      INSTRUCTIONS:
      1. Write in a rich, engaging, and professional style.
      2. INTEGRATE VISUAL SUGGESTIONS: Periodically insert placeholders using the format: [VISUAL: Description of a professional illustration or icon showing [Topic]].
      3. Use clean markdown structure for readability.
      4. Ensure the content is deep and extensive.`,
    });

    return response.text || "Neural core failed to generate content.";
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A professional book illustration for a ${genre} book. Concept: ${desc}. Visual style: highly aesthetic, cohesive, clean. No text on image. High resolution.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image synthesis failed.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const styles = [
      "Minimalist and modern typography focused",
      "Cinematic artistic style",
      "Elegant classic hardcover style"
    ];

    const covers: string[] = [];

    for (const style of styles) {
      const prompt = `A professional high-quality book cover for a book titled "${title}". Genre: ${genre}. Visual style: ${style}. Extremely aesthetic, high resolution.`;
      
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: "3:4"
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            covers.push(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (e) {
        console.warn("Cover generation skip:", e);
      }
    }

    return covers;
  }
};