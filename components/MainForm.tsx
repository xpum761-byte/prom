import React, { useState } from 'react';
import { Topic, Language, type GenerationResult } from '../types';
import { generateRandomStoryIdea, generateDescriptiveTitle, generatePromptDetails } from '../services/geminiService';
import { SparklesIcon, RocketIcon, DiceIcon } from './Icons';

interface MainFormProps {
    apiKey: string;
    setApiKey: (key: string) => void;
    setView: (view: 'form' | 'results') => void;
    setGenerationResult: (result: GenerationResult) => void;
}

const topicOptions = [
    { id: Topic.Animation, emoji: '😭😂' },
    { id: Topic.Song, emoji: '🎵' },
    { id: Topic.Story, emoji: '📚' },
    { id: Topic.Animal, emoji: '🐾' },
    { id: Topic.Adventure, emoji: '⚡️' },
    { id: Topic.Education, emoji: '🎓' },
];

const MainForm: React.FC<MainFormProps> = ({ apiKey, setApiKey, setView, setGenerationResult }) => {
    const [scenes, setScenes] = useState<string>('3');
    const [selectedTopic, setSelectedTopic] = useState<Topic>(Topic.Animation);
    const [storyIdea, setStoryIdea] = useState<string>('');
    const [outputLanguage, setOutputLanguage] = useState<Language>(Language.Both);

    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);

    const checkApiKey = () => {
        if (!apiKey.trim()) {
            alert("Please enter your Gemini API Key to proceed.");
            return false;
        }
        return true;
    }

    const handleGenerateIdea = async () => {
        if (!checkApiKey()) return;
        setIsGeneratingIdea(true);
        const idea = await generateRandomStoryIdea(selectedTopic, apiKey);
        setStoryIdea(idea);
        setIsGeneratingIdea(false);
    };

    const handleGenerateTitle = async () => {
        if (!checkApiKey()) return;
        setIsGeneratingTitle(true);
        const title = await generateDescriptiveTitle(storyIdea, apiKey);
        // We'll prepend the title to the story idea for context
        setStoryIdea(`${title}\n\n${storyIdea}`);
        setIsGeneratingTitle(false);
    };
    
    const handleGenerateDetails = async () => {
        if (!checkApiKey()) return;
        if (!storyIdea || !scenes) {
            alert("Please provide a story idea and number of scenes.");
            return;
        }
        setIsGeneratingDetails(true);
        try {
            const numScenes = parseInt(scenes, 10);
            const prompts = await generatePromptDetails(numScenes, selectedTopic, storyIdea, outputLanguage, apiKey);
            setGenerationResult({
                scenes: numScenes,
                duration: numScenes * 8,
                topic: selectedTopic,
                prompts,
            });
            setView('results');
        } catch (error) {
            console.error(error);
            alert("An error occurred while generating the prompt details. Please check your API key and try again.");
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <label htmlFor="api-key" className="text-sm font-medium text-indigo-200">Gemini API Key</label>
                <input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-pink-400 focus:outline-none transition"
                    placeholder="Masukkan API Key Anda di sini"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="scenes" className="text-sm font-medium text-indigo-200">Jumlah Scene</label>
                <input
                    id="scenes"
                    type="number"
                    value={scenes}
                    onChange={(e) => setScenes(e.target.value)}
                    className="w-full p-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-pink-400 focus:outline-none transition"
                    placeholder="3"
                />
            </div>

            <div className="space-y-2">
                <p className="text-sm font-medium text-indigo-200">Pilih Topik Utama</p>
                <div className="grid grid-cols-2 gap-3">
                    {topicOptions.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic.id)}
                            className={`p-4 bg-white/10 rounded-lg backdrop-blur-sm border transition-all ${selectedTopic === topic.id ? 'border-pink-400 ring-2 ring-pink-400' : 'border-white/20'}`}
                        >
                            <div className="text-2xl">{topic.emoji}</div>
                            <div className="font-semibold mt-1">{topic.id}</div>
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleGenerateIdea} disabled={isGeneratingIdea} className="w-full flex items-center justify-center gap-2 bg-teal-400 text-slate-900 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-teal-300 transition-colors disabled:bg-teal-600 disabled:cursor-not-allowed">
                {isGeneratingIdea ? 'Generating...' : <><DiceIcon /> Generate Ide Cerita Acak</>}
            </button>

            <div className="space-y-2">
                <label htmlFor="story-idea" className="text-sm font-medium text-indigo-200">Ide Cerita (atau buat sendiri)</label>
                <textarea
                    id="story-idea"
                    rows={4}
                    value={storyIdea}
                    onChange={(e) => setStoryIdea(e.target.value)}
                    className="w-full p-3 bg-white/20 rounded-lg border border-white/30 focus:ring-2 focus:ring-pink-400 focus:outline-none transition"
                    placeholder="Contoh: Kucing ninja mencari gulungan ajaib..."
                />
            </div>

             <button onClick={handleGenerateTitle} disabled={!storyIdea || isGeneratingTitle} className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                 {isGeneratingTitle ? 'Generating...' : <><SparklesIcon /> Buat Judul Deskriptif dengan AI</>}
            </button>


            <div className="space-y-2">
                <p className="text-sm font-medium text-indigo-200">Bahasa Output</p>
                <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                    {Object.values(Language).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setOutputLanguage(lang)}
                            className={`w-1/3 py-2 rounded-md font-semibold transition-colors text-sm ${outputLanguage === lang ? 'bg-indigo-400 shadow-inner' : 'text-indigo-200'}`}
                        >
                            {lang === Language.Both && 'Keduanya'}
                            {lang === Language.Indonesia && '🇮🇩 Indonesia'}
                            {lang === Language.English && '🇬🇧 English'}
                        </button>
                    ))}
                </div>
            </div>
            
            <button
                onClick={handleGenerateDetails}
                disabled={isGeneratingDetails}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-extrabold py-4 px-6 rounded-xl shadow-xl hover:scale-105 transition-transform disabled:from-pink-700 disabled:to-orange-600 disabled:cursor-wait"
            >
                {isGeneratingDetails ? 'Generating...' : <><RocketIcon /> Generate Prompt Detail</>}
            </button>
            

            <div className="p-4 bg-yellow-100/20 border border-yellow-200/50 rounded-lg text-sm">
                <h3 className="font-bold text-yellow-200 flex items-center gap-2 mb-2">💡 Tips Membuat Konten Viral:</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-200/90">
                    <li>Gunakan karakter yang ekspresif dan lucu.</li>
                    <li>Tambahkan musik yang catchy dan energik.</li>
                    <li>Buat gerakan yang mudah ditiru anak-anak.</li>
                    <li>Kombinasikan edukasi dengan entertainment.</li>
                    <li>Gunakan warna-warna cerah dan kontras tinggi.</li>
                </ul>
            </div>
        </div>
    );
};

export default MainForm;