import React, { useState, useEffect } from 'react';
import { type GenerationResult } from '../types';
import { generateVideoForScene } from '../services/geminiService';
import { TargetIcon, FilmReelIcon, SaveIcon, VideoIcon } from './Icons';

interface ResultsPageProps {
    result: GenerationResult;
    onBack: () => void;
    apiKey: string;
}

const StatCard: React.FC<{ value: string | number, label: string }> = ({ value, label }) => (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center">
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-indigo-200">{label}</div>
    </div>
);

const PromptCard: React.FC<{ scene: GenerationResult['prompts'][0] }> = ({ scene }) => (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-3 text-sm">
        <h3 className="font-bold text-lg text-pink-300">🎬 Scene {scene.sceneNumber}</h3>
        
        <div className="space-y-1">
            <p className="font-semibold text-indigo-200">Visual Description:</p>
            <p className="text-white/90">{scene.visualDescription}</p>
        </div>

        {scene.indonesianPrompt && (
          <div className="space-y-1">
              <p className="font-semibold text-indigo-200">🇮🇩 Prompt Indonesia:</p>
              <p className="text-white/90">{scene.indonesianPrompt}</p>
          </div>
        )}
        
        {scene.englishPrompt && (
          <div className="space-y-1">
              <p className="font-semibold text-indigo-200">🇬🇧 English Prompt:</p>
              <p className="text-white/90">{scene.englishPrompt}</p>
          </div>
        )}
    </div>
);

type VideoStatus = 'idle' | 'generating' | 'done' | 'error';
interface VideoGenerationState {
    status: VideoStatus;
    url: string | null;
    errorMessage?: string;
}

const VideoPromptCard: React.FC<{
    scene: GenerationResult['prompts'][0];
    generationState: VideoGenerationState;
    onGenerate: () => void;
}> = ({ scene, generationState, onGenerate }) => {
    
    const { status, url, errorMessage } = generationState;
    const audioPrompt = scene.indonesianPrompt || scene.englishPrompt;

    return (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-3 text-sm">
            <h3 className="font-bold text-lg text-pink-300 flex items-center gap-2">
                <VideoIcon /> Scene {scene.sceneNumber}
            </h3>
            
            <div className="space-y-1">
                <p className="font-semibold text-indigo-200">Visual Prompt:</p>
                <p className="text-white/90 italic">"{scene.visualDescription}"</p>
            </div>

            {audioPrompt && (
                <div className="space-y-1">
                    <p className="font-semibold text-indigo-200">Audio Prompt (Narasi):</p>
                    <p className="text-white/90 italic">"{audioPrompt}"</p>
                </div>
            )}
            
            <div className="mt-4">
                {status === 'idle' && (
                     <button
                        onClick={onGenerate}
                        className="w-full flex items-center justify-center gap-2 bg-teal-400 text-slate-900 font-bold py-2 px-4 rounded-lg shadow-lg hover:bg-teal-300 transition-colors"
                    >
                        <VideoIcon /> Generate Video
                    </button>
                )}
                {status === 'generating' && (
                    <div className="text-center p-4 bg-black/20 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-300 mx-auto"></div>
                        <p className="mt-3 font-semibold text-teal-200">Generating video...</p>
                        <p className="text-xs text-indigo-200">This may take a few minutes. Please wait.</p>
                    </div>
                )}
                {status === 'error' && (
                     <div className="text-center p-4 bg-red-900/50 rounded-lg">
                        <p className="font-bold text-red-300">Generation Failed</p>
                        <p className="text-xs text-red-300/80 mt-1">{errorMessage || 'An unknown error occurred.'}</p>
                        <button
                            onClick={onGenerate}
                            className="mt-3 text-xs bg-white/20 py-1 px-3 rounded-md hover:bg-white/30"
                        >
                            Retry
                        </button>
                    </div>
                )}
                {status === 'done' && url && (
                    <video controls src={url} className="w-full rounded-lg aspect-video bg-black/30"></video>
                )}
            </div>
        </div>
    );
};


const ResultsPage: React.FC<ResultsPageProps> = ({ result, onBack, apiKey }) => {
    const [activeTab, setActiveTab] = useState<'prompts' | 'video'>('prompts');
    const [videoStates, setVideoStates] = useState<Record<number, VideoGenerationState>>({});

    useEffect(() => {
        const initialStates: Record<number, VideoGenerationState> = {};
        result.prompts.forEach(p => {
            initialStates[p.sceneNumber] = { status: 'idle', url: null };
        });
        setVideoStates(initialStates);
    }, [result]);

    const handleGenerateVideo = async (sceneNumber: number) => {
        if (!apiKey) {
            alert("API Key is missing. Please go back and enter it.");
            return;
        }
        const scene = result.prompts.find(p => p.sceneNumber === sceneNumber);
        if (!scene) return;

        setVideoStates(prev => ({
            ...prev,
            [sceneNumber]: { ...prev[sceneNumber], status: 'generating', errorMessage: undefined }
        }));

        try {
            const audioPrompt = scene.indonesianPrompt || scene.englishPrompt || '';
            const videoUrl = await generateVideoForScene(scene.visualDescription, audioPrompt, apiKey);
            setVideoStates(prev => ({
                ...prev,
                [sceneNumber]: { status: 'done', url: videoUrl }
            }));
        } catch (error) {
            console.error(`Failed to generate video for scene ${sceneNumber}:`, error);
            setVideoStates(prev => ({
                ...prev,
                [sceneNumber]: { 
                    status: 'error', 
                    url: null, 
                    errorMessage: error instanceof Error ? error.message : String(error) 
                }
            }));
        }
    };

    const handleSave = () => {
        const textToSave = result.prompts.map(p => 
`Scene ${p.sceneNumber}
Visual: ${p.visualDescription}
Prompt ID: ${p.indonesianPrompt}
Prompt EN: ${p.englishPrompt}`
        ).join('\n\n---\n\n');
        
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hasil-prompt.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <header className="flex items-center gap-3">
                <TargetIcon />
                <h1 className="text-2xl font-bold">Hasil Prompt Detail</h1>
            </header>

            <div className="grid grid-cols-2 gap-4">
                <StatCard value={result.scenes} label="Scene" />
                <StatCard value={`${result.duration} detik`} label="Durasi" />
                <StatCard value={result.prompts.length} label="Dibuat" />
                <StatCard value={result.topic} label="Topik" />
            </div>

            <div className="flex bg-white/10 rounded-lg p-1 border border-white/20">
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`w-1/2 py-2 rounded-md font-semibold transition-colors text-sm ${activeTab === 'prompts' ? 'bg-indigo-400 shadow-inner' : 'text-indigo-200'}`}
                >
                    Hasil Prompt
                </button>
                <button
                    onClick={() => setActiveTab('video')}
                    className={`w-1/2 py-2 rounded-md font-semibold transition-colors text-sm ${activeTab === 'video' ? 'bg-indigo-400 shadow-inner' : 'text-indigo-200'}`}
                >
                    Video Generator
                </button>
            </div>

            {activeTab === 'prompts' && (
                <div className="space-y-4">
                    {result.prompts.length > 0 ? (
                        result.prompts.map((prompt) => <PromptCard key={prompt.sceneNumber} scene={prompt} />)
                    ) : (
                        <div className="bg-white/10 backdrop-blur-sm border border-dashed border-white/30 rounded-xl p-8 text-center flex flex-col items-center">
                            <FilmReelIcon />
                            <p className="font-semibold mt-4">Kartu prompt akan muncul di sini.</p>
                            <p className="text-sm text-indigo-200">Setiap kartu mewakili satu scene cerita.</p>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'video' && (
                <div className="space-y-4">
                    {result.prompts.map((prompt) => (
                        <VideoPromptCard 
                            key={prompt.sceneNumber}
                            scene={prompt}
                            generationState={videoStates[prompt.sceneNumber] || { status: 'idle', url: null }}
                            onGenerate={() => handleGenerateVideo(prompt.sceneNumber)}
                        />
                    ))}
                </div>
            )}

            {activeTab === 'prompts' && (
                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-white/30 transition-colors"
                >
                    <SaveIcon />
                    Simpan Hasil Prompt
                </button>
            )}

            <button
                onClick={onBack}
                className="w-full text-center text-indigo-200 hover:text-white transition-colors"
            >
                Kembali
            </button>
        </div>
    );
};

export default ResultsPage;