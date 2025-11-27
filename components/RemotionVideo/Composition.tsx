import React from 'react';
import { Sequence, AbsoluteFill, Audio, staticFile } from 'remotion';
import { Scene } from './Scene';
import { VideoConfig } from '../../types';

interface MainCompositionProps {
  data: VideoConfig;
  [key: string]: unknown;
}

export const MainComposition: React.FC<MainCompositionProps> = ({ data }) => {
  let currentFrame = 0;

  if (!data || !data.scenes) {
    return (
      <AbsoluteFill style={{ backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{color: 'white'}}>No Scene Data Available</h1>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {data.scenes.map((scene, index) => {
        const from = currentFrame;
        currentFrame += scene.durationInFrames;

        return (
          <Sequence
            key={index}
            from={from}
            durationInFrames={scene.durationInFrames}
          >
            <Scene data={scene} />
          </Sequence>
        );
      })}
      
      {/* Background Audio Placeholder - In a real app, this would be dynamic */}
      {/* <Audio src={staticFile("audio/upbeat.mp3")} volume={0.5} /> */}
    </AbsoluteFill>
  );
};