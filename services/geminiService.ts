
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types.ts";

// Helper to safely get AI instance
const getAI = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).API_KEY;
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    const ai = getAI();
    const chapterCount = Math.max(5, Math.min(30, Math.ceil(length / 10)));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional book outline for a ${genre} book titled "${title}". 
      The book should be approximately ${length} pages long. Provide exactly ${chapterCount} chapters. 
      Each chapter should have a title and a list of 3-5 sub-topics.`,
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

    const data = JSON.parse(response.text);
    return data.map((item: any, index: number) => ({
      id: `ch-${index}`,
      title: item.title,
      subsections: item.subsections,
      status: 'pending'
    }));
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class professional author. Write the full, detailed content for Chapter: "${chapter.title}" 
      of the book "${bookTitle}" (Genre: ${genre}). 
      Include these topics: ${chapter.subsections.join(', ')}. 
      
      INSTRUCTIONS:
      1. Write in a rich, engaging, and professional style.
      2. INTEGRATE VISUAL SUGGESTIONS: Periodically insert placeholders for professional icons, photos, or diagrams to aid understanding. Use the format: [VISUAL: Description of a professional illustration or icon showing [Topic]].
      3. Do NOT use # or ** symbols directly in a way that looks like raw code; use clean markdown structure that can be parsed.
      4. Ensure the content is deep and extensive.`,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    return response.text;
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const ai = getAI();
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
    throw new Error("Failed to generate image.");
  },

  async generateCovers(title: string, genre: string): Promise<string[]> {
    const ai = getAI();
    const styles = [
      "Minimalist and modern",
      "Epic cinematic style",
      "Classic vintage hardcover style",
      "Professional non-fiction typography focused"
    ];

    const covers: string[] = [];

    for (const style of styles) {
      const prompt = `A professional high-quality book cover for a book titled "${title}". Genre: ${genre}. Visual style: ${style}. No text on image except possibly the title. Extremely aesthetic, high resolution, suitable for Amazon KDP.`;
      
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
    }

    return covers;
  }
};
