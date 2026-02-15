
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async generateOutline(title: string, genre: string, length: number): Promise<Chapter[]> {
    // Scale chapter count based on length (roughly 1 chapter per 10-15 pages)
    const chapterCount = Math.max(8, Math.min(50, Math.ceil(length / 10)));
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a comprehensive, professional book outline for a ${genre} book titled "${title}". 
      The target book length is ${length} pages. Provide exactly ${chapterCount} logical chapters. 
      Each chapter should have a compelling title and a list of 4-6 specific sub-topics/sections to ensure the depth required for a ${length}-page manuscript.`,
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
      id: `ch-${Date.now()}-${index}`,
      title: item.title,
      subsections: item.subsections,
      status: 'pending'
    }));
  },

  async generateChapterContent(bookTitle: string, genre: string, chapter: Chapter, targetTotalPages: number): Promise<string> {
    // Determine depth based on total book scale
    const depthInstruction = targetTotalPages > 200 
      ? "Provide exhaustive, deep, and scholarly detail for this chapter. Aim for a multi-thousand word output with nuanced arguments and storytelling."
      : "Provide a detailed and engaging narrative for this chapter with professional depth.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a world-class award-winning author. Write the complete, high-quality content for Chapter: "${chapter.title}" 
      of the book "${bookTitle}" (Genre: ${genre}). 
      
      STRUCTURE TO COVER:
      ${chapter.subsections.map(s => `- ${s}`).join('\n')}
      
      CRITICAL INSTRUCTIONS:
      1. STYLE: Professional, rich, and immersive. Use sophisticated vocabulary.
      2. DEPTH: ${depthInstruction}
      3. VISUALS: Integrate professional visual markers. Periodically insert [VISUAL: Description of a relevant illustration, chart, or icon] to break up the text.
      4. FORMATTING: Use Markdown (## for subheadings, *italic*, **bold**, lists). Do not include the chapter title in the body.
      5. ENGAGEMENT: Ensure smooth transitions between the sub-topics listed above.`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text;
  },

  async generateChapterImage(desc: string, genre: string): Promise<string> {
    const prompt = `A professional, highly aesthetic book illustration for a ${genre} book. Concept: ${desc}. Style: clean, modern, minimal, slightly abstract, professional lighting, 4k. No text.`;
    
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
    const styles = [
      "Modern Minimalist Serif Typography, dramatic lighting",
      "Epic cinematic digital art, concept-driven",
      "Vintage classic cloth-bound hardcover texture with gold foil accents",
      "Abstract geometric professional corporate style"
    ];

    const covers: string[] = [];

    for (const style of styles) {
      try {
        const prompt = `A professional high-end book cover design for a book titled "${title}". Genre: ${genre}. Style: ${style}. Extremely aesthetic, high resolution, professional font layout (though text might be abstract). 3:4 aspect ratio.`;
        
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
        console.error("Cover generation failed for style:", style);
      }
    }

    return covers;
  }
};
