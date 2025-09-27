export enum Topic {
    Animation = "Animasi",
    Song = "Lagu",
    Story = "Cerita",
    Animal = "Hewan",
    Adventure = "Petualangan",
    Education = "Edukasi",
}

export enum Language {
    Both = "Keduanya",
    Indonesia = "Indonesia",
    English = "English",
}

export interface ScenePrompt {
    sceneNumber: number;
    indonesianPrompt: string;
    englishPrompt: string;
    visualDescription: string;
}

export interface GenerationResult {
    scenes: number;
    duration: number;
    topic: Topic;
    prompts: ScenePrompt[];
}
