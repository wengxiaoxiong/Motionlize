import React, { useState, useMemo } from 'react';
import { Player } from '@remotion/player';
import { GeneratorForm } from './components/GeneratorForm';
import { MainComposition } from './components/RemotionVideo/Composition';
import { VideoConfig } from './types';

// Reproduction of the Redis Distributed Lock logic as default data
const INITIAL_DATA: VideoConfig = {
  topic: "Redis Distributed Lock",
  musicMood: "Techno / Cyberpunk",
  totalDuration: 240, // 8 seconds
  width: 1080,
  height: 1080,
  fps: 30,
  scenes: [
    {
      type: 'tech_diagram',
      title: "Redis Distributed Lock",
      subtitle: "SETNX Concurrency",
      backgroundColor: "#0f172a",
      textColor: "#e2e8f0",
      durationInFrames: 240,
      diagramConfig: {
        nodes: [
          { id: 'redis', type: 'database', label: 'Redis Master', x: 50, y: 50, color: '#ef4444' },
          { id: 'clientA', type: 'client', label: 'Client A', x: 50, y: 15, color: '#3b82f6' },
          { id: 'clientB', type: 'client', label: 'Client B', x: 80, y: 80, color: '#a855f7' },
          { id: 'clientC', type: 'client', label: 'Client C', x: 20, y: 80, color: '#a855f7' },
        ],
        edges: [
          { fromId: 'clientA', toId: 'redis' },
          { fromId: 'clientB', toId: 'redis' },
          { fromId: 'clientC', toId: 'redis' },
        ],
        actions: [
          // Phase 1: Requests in flight
          { type: 'packet', startDelay: 30, duration: 40, fromId: 'clientA', toId: 'redis', label: 'SETNX', color: '#3b82f6' },
          { type: 'packet', startDelay: 35, duration: 40, fromId: 'clientB', toId: 'redis', label: 'SETNX', color: '#a855f7' },
          { type: 'packet', startDelay: 40, duration: 40, fromId: 'clientC', toId: 'redis', label: 'SETNX', color: '#a855f7' },
          
          // Phase 2: Lock Acquired
          { type: 'highlight', startDelay: 70, duration: 20, targetId: 'redis', color: '#ef4444' },
          { type: 'show_label', startDelay: 75, duration: 100, targetId: 'redis', label: 'LOCKED', color: '#ef4444' },

          // Phase 3: Responses
          { type: 'packet', startDelay: 90, duration: 30, fromId: 'redis', toId: 'clientA', label: 'OK', color: '#10b981' },
          { type: 'packet', startDelay: 95, duration: 30, fromId: 'redis', toId: 'clientB', label: 'FAIL', color: '#ef4444' },
          { type: 'packet', startDelay: 100, duration: 30, fromId: 'redis', toId: 'clientC', label: 'FAIL', color: '#ef4444' },
        ]
      }
    }
  ]
};

const App: React.FC = () => {
  const [videoData, setVideoData] = useState<VideoConfig>(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize input props to avoid unnecessary player re-renders
  const inputProps = useMemo(() => ({ data: videoData }), [videoData]);

  const handleDownload = () => {
    // In a browser-only environment, we cannot run FFmpeg or Headless Chrome (which Remotion needs for MP4).
    // Standard practice is to export the project JSON or inform the user.
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(videoData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `animation-${videoData.topic.replace(/\s+/g, '-').toLowerCase()}.json`;
    link.click();
    
    alert("Download Started: Saved as project JSON.\n\nNOTE: To render a real .mp4 file, Remotion requires a Node.js server (npx remotion render). Since this is a browser-only demo, we exported your project configuration instead.");
  };

  // Determine layout mode
  // If Width >= Height, we treat it as Landscape/Square (Fit width 100%)
  // If Height > Width, we treat as Portrait (Constrain Height)
  const isLandscapeOrSquare = videoData.width >= videoData.height;

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-brand-500 selection:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">M</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">AI MG Generator</h1>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={handleDownload}
               className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center space-x-1"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                <span>Download MP4</span>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 w-full">
        {/* Left Panel: Input */}
        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
              Turn Ideas into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-400">
                Motion Graphics
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg">
              Generate smooth, professional-grade animations for social media, presentations, or explainers in seconds. Now supports <strong>Tech Diagrams</strong>.
            </p>
          </div>

          <GeneratorForm 
            onVideoGenerated={setVideoData} 
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        </div>

        {/* Right Panel: Player */}
        <div className="flex-1 flex flex-col items-center justify-center bg-dark-800/50 rounded-2xl border border-dark-700 p-4 lg:p-8 backdrop-blur-sm">
           <div 
             className="shadow-2xl rounded-lg overflow-hidden ring-4 ring-dark-800 relative group transition-all duration-500 flex justify-center items-center bg-black"
             style={{
               aspectRatio: `${videoData.width} / ${videoData.height}`,
               width: isLandscapeOrSquare ? '100%' : 'auto',
               height: isLandscapeOrSquare ? 'auto' : '600px',
               maxWidth: '100%',
               maxHeight: '70vh' // Ensure it doesn't overflow vertically on small screens
             }}
           >
             
             {/* Player Wrapper */}
             <Player
                component={MainComposition}
                inputProps={inputProps}
                durationInFrames={videoData.totalDuration}
                compositionWidth={videoData.width}
                compositionHeight={videoData.height}
                fps={videoData.fps}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                controls
                autoPlay
                loop
                acknowledgeRemotionLicense
              />

              {/* Loading Overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-10 flex-col">
                  <div className="animate-pulse flex flex-col items-center">
                     <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <span className="text-brand-200 font-mono">Generating Scenes...</span>
                  </div>
                </div>
              )}
           </div>
           
           <div className="mt-4 text-xs text-gray-500 flex justify-between w-full max-w-md">
              <span>{videoData.width}x{videoData.height} @ {videoData.fps}fps</span>
              <span>{(videoData.totalDuration / videoData.fps).toFixed(1)}s</span>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;