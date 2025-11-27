import React, { useState } from 'react';
import { generateVideoScript } from '../services/geminiService';
import { VideoConfig } from '../types';

interface GeneratorFormProps {
  onVideoGenerated: (config: VideoConfig) => void;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
}

export const GeneratorForm: React.FC<GeneratorFormProps> = ({ onVideoGenerated, isGenerating, setIsGenerating }) => {
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // New Controls
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [duration, setDuration] = useState<number>(15); // Seconds

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Pass duration to service
      const geminiData = await generateVideoScript(topic, duration);
      
      const totalDuration = geminiData.scenes.reduce((acc, scene) => acc + scene.durationInFrames, 0);

      // Resolve Dimensions
      let width = 1080;
      let height = 1080;
      if (aspectRatio === '16:9') {
        width = 1920;
        height = 1080;
      } else if (aspectRatio === '9:16') {
        width = 1080;
        height = 1920;
      }

      const videoConfig: VideoConfig = {
        topic,
        musicMood: geminiData.suggestedMusicMood,
        scenes: geminiData.scenes,
        totalDuration,
        width, 
        height,
        fps: 30
      };

      onVideoGenerated(videoConfig);
    } catch (err: any) {
      setError(err.message || "Failed to generate video. Please check your API Key or try a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-dark-800 rounded-xl border border-dark-700 shadow-2xl">
      <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-purple-400">
        Create Your Animation
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-400 mb-1">
            What is your video about?
          </label>
          <textarea
            id="topic"
            rows={2}
            className="w-full px-4 py-3 bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder-gray-500 outline-none transition-all resize-none"
            placeholder="e.g. Redis Architecture, How HTTPS works..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Aspect Ratio</label>
            <div className="flex space-x-2">
              {[
                { label: 'Square (1:1)', val: '1:1' },
                { label: 'Land (16:9)', val: '16:9' },
                { label: 'Port (9:16)', val: '9:16' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setAspectRatio(opt.val as any)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md border transition-all ${
                    aspectRatio === opt.val
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'bg-dark-900 border-dark-700 text-gray-400 hover:border-dark-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
             <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 bg-dark-900 border border-dark-700 rounded-lg focus:ring-2 focus:ring-brand-500 text-white outline-none"
             >
                <option value={15}>Short (~15s)</option>
                <option value={30}>Medium (~30s)</option>
                <option value={60}>Long (~60s)</option>
             </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-2 transition-all ${
            isGenerating || !topic.trim()
              ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Writing Script & Designing...</span>
            </>
          ) : (
            <>
              <span>Generate Animation</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};