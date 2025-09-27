import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import `Language` as a value because it is used to access enum members. It was previously imported as a type-only, which caused an error.
import { Language, type ScenePrompt, type Topic } from '../types';

export const generateRandomStoryIdea = async (topic: Topic, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a one-sentence random, fun, and quirky story idea about the topic: ${topic}. Make it suitable for a viral short video.`,
            config: {
                temperature: 1,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating random story idea:", error);
        return "Error: Could not generate story idea.";
    }
};

export const generateDescriptiveTitle = async (storyIdea: string, apiKey: string): Promise<string> => {
     if (!storyIdea) return "";
     if (!apiKey) throw new Error("API Key is missing.");
     const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a short, catchy, descriptive title for this story, suitable for a social media video: "${storyIdea}"`,
            config: {
                temperature: 0.8,
            }
        });
        return response.text.replace(/["*]/g, '').trim();
    } catch (error) {
        console.error("Error generating descriptive title:", error);
        return "Error: Could not generate title.";
    }
};


export const generatePromptDetails = async (
    scenes: number,
    topic: Topic,
    storyIdea: string,
    language: Language,
    apiKey: string
): Promise<ScenePrompt[]> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    const languageInstruction = {
        [Language.Both]: "Provide prompts in both Indonesian and English.",
        [Language.Indonesia]: "Provide prompts only in Indonesian. The English prompt field can be a short summary.",
        [Language.English]: "Provide prompts only in English. The Indonesian prompt field can be a short summary.",
    }[language];

    const prompt = `
        You are an AI assistant specialized in creating viral short-form video content scripts.
        Your goal is to break down a story idea into distinct, visually engaging scenes.

        Create a script for a short viral video based on this idea: "${storyIdea}".

        **Parameters:**
        - Topic: ${topic}
        - Number of Scenes: ${scenes}
        - Desired Language(s): ${languageInstruction}

        For each scene, provide the following details. The prompts should be concise and powerful, suitable for an AI video generator.
        The visual description should be vivid and detailed.
        The total video duration should be approximately ${scenes * 8} seconds.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
          prompts: {
            type: Type.ARRAY,
            description: "An array of scene details.",
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER, description: "The sequence number of the scene." },
                indonesianPrompt: { type: Type.STRING, description: "The script/prompt for this scene in Indonesian. If not requested, provide a concise summary." },
                englishPrompt: { type: Type.STRING, description: "The script/prompt for this scene in English. If not requested, provide a concise summary." },
                visualDescription: { type: Type.STRING, description: "A detailed description of the visuals for this scene, for an AI image/video generator." },
              },
              required: ["sceneNumber", "indonesianPrompt", "englishPrompt", "visualDescription"],
            },
          },
        },
        required: ["prompts"],
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.prompts as ScenePrompt[];
    } catch (error) {
        console.error("Error generating prompt details:", error);
        throw new Error("Failed to generate details from AI.");
    }
};

export const generateVideoForScene = async (
    visualPrompt: string, 
    audioPrompt: string, 
    apiKey: string
): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing.");
    const ai = new GoogleGenAI({ apiKey });

    // Combine visual and audio prompts for the new model
    const combinedPrompt = `
        Generate a video with audio.
        Visuals: ${visualPrompt}.
        Audio/Narration: "${audioPrompt}".
    `;

    try {
        // NOTE: Using a hypothetical 'veo-3.0-generate-001' model as requested.
        // This model is assumed to support combined video and audio generation.
        let operation = await ai.models.generateVideos({
            model: 'veo-3.0-generate-001',
            prompt: combinedPrompt,
            config: {
                numberOfVideos: 1
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before polling again
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded, but no download link was found.");
        }

        // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
        const response = await fetch(`${downloadLink}&key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`Failed to download video file. Status: ${response.status}`);
        }

        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        return videoUrl;

    } catch (error) {
        console.error("Error during video generation process:", error);
        if (error instanceof Error) {
           throw new Error(`Failed to generate video: ${error.message}`);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
};