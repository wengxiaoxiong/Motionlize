import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { SceneData } from '../../types';
import { TechScene } from './TechScene';

interface SceneProps {
  data: SceneData;
}

export const Scene: React.FC<SceneProps> = ({ data }) => {
  // Use specialized renderer for Tech Diagrams
  if (data.type === 'tech_diagram') {
    return <TechScene data={data} />;
  }

  // --- Standard Scene Logic (Intro, Quote, etc.) ---
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  // Entrance animation (spring)
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  // Text slide up effect
  const textTranslateY = interpolate(entrance, [0, 1], [100, 0]);
  const opacity = interpolate(frame, [0, 10, data.durationInFrames - 10, data.durationInFrames], [0, 1, 1, 0]);

  // Dynamic style based on scene type
  const isQuote = data.type === 'quote';
  const isIntro = data.type === 'intro';

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: data.backgroundColor,
        color: data.textColor,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Decorative Background Elements based on type */}
      {isIntro && (
        <div 
           style={{
             position: 'absolute',
             width: width * 1.5,
             height: width * 1.5,
             borderRadius: '50%',
             border: `4px solid ${data.textColor}`,
             opacity: 0.1,
             transform: `scale(${entrance})`,
           }}
        />
      )}

      <div style={{ opacity, transform: `translateY(${textTranslateY}px)` }}>
        {isQuote && <span className="text-6xl block mb-4">“</span>}
        
        <h1
          style={{
            fontSize: isIntro ? '80px' : isQuote ? '50px' : '70px',
            fontWeight: 800,
            marginBottom: '20px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          {data.title}
        </h1>
        
        <p
          style={{
            fontSize: '32px',
            fontWeight: 400,
            opacity: 0.9,
            maxWidth: '80%',
            margin: '0 auto',
          }}
        >
          {data.subtitle}
        </p>

        {isQuote && <span className="text-6xl block mt-4">”</span>}
      </div>

      {/* Progress Bar */}
      <div 
        style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '10px',
            backgroundColor: data.textColor,
            width: `${(frame / data.durationInFrames) * 100}%`,
            opacity: 0.5
        }}
      />
    </div>
  );
};