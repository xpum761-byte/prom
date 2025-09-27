import React, { useState } from 'react';
import MainForm from './components/MainForm';
import ResultsPage from './components/ResultsPage';
import { type GenerationResult } from './types';

type View = 'form' | 'results';

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  const handleBackToForm = () => {
    setGenerationResult(null);
    setView('form');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-indigo-500 via-purple-600 to-indigo-700 font-sans text-white">
      <div className="container mx-auto max-w-md p-4">
        {view === 'form' ? (
          <MainForm 
            apiKey={apiKey}
            setApiKey={setApiKey}
            setView={setView} 
            setGenerationResult={setGenerationResult} 
          />
        ) : generationResult ? (
          <ResultsPage 
            result={generationResult} 
            onBack={handleBackToForm} 
            apiKey={apiKey}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;