import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { SceneData, DiagramNode, DiagramEdge, DiagramAction } from '../../types';

// --- SVG PATHS ---
const DB_PATH = "M 0 5 A 20 6 0 1 1 40 5 L 40 30 A 20 6 0 1 1 0 30 Z M 0 5 A 20 6 0 1 0 40 5"; // Simplified cylinder
const LOCK_BODY_PATH = "M 10 15 H 30 V 30 H 10 Z";
const LOCK_SHACKLE_PATH = "M 15 15 V 10 A 5 5 0 1 1 25 10 V 15";
const SERVER_PATH = "M 2 2 H 38 V 38 H 2 Z M 5 10 H 35 M 5 20 H 35 M 5 30 H 35";
const USER_PATH = "M 20 10 A 8 8 0 1 1 20 26 A 8 8 0 1 1 20 10 M 10 38 Q 20 28 30 38";

interface TechSceneProps {
    data: SceneData;
}

export const TechScene: React.FC<TechSceneProps> = ({ data }) => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();
    
    if (!data.diagramConfig) return null;

    // SAFETY: Default to empty arrays if undefined to prevent "Cannot read properties of undefined (reading 'map')"
    const nodes = data.diagramConfig.nodes || [];
    const edges = data.diagramConfig.edges || [];
    const actions = data.diagramConfig.actions || [];
    
    const baseSize = Math.min(width, height) * 0.06; // Scaling factor based on screen size

    // Helpers
    const toPx = (pct: number, dim: number) => (pct / 100) * dim;

    return (
        <div style={{
            flex: 1,
            backgroundColor: data.backgroundColor, // Use scene background
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'JetBrains Mono, monospace'
        }}>
            {/* 3D Grid Background - Tech Aesthetic */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
                transform: 'perspective(500px) rotateX(60deg) translateY(0px) translateZ(-100px)',
                opacity: 0.4
            }} />

            {/* Title Overlay */}
            <div className="absolute top-10 left-10 z-50">
                 <h2 className="text-3xl font-bold" style={{ color: data.textColor }}>{data.title}</h2>
                 <p className="text-xl opacity-70" style={{ color: data.textColor }}>{data.subtitle}</p>
            </div>

            {/* Connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                {edges.map((edge, i) => {
                    const from = nodes.find(n => n.id === edge.fromId);
                    const to = nodes.find(n => n.id === edge.toId);
                    if (!from || !to) return null;

                    const x1 = toPx(from.x, width);
                    const y1 = toPx(from.y, height);
                    const x2 = toPx(to.x, width);
                    const y2 = toPx(to.y, height);

                    // Entrance animation for lines
                    const lineProgress = spring({ frame: frame - (i * 5), fps, config: { damping: 200 } });
                    
                    return (
                        <g key={i} opacity={interpolate(lineProgress, [0, 1], [0, 0.5])}>
                            <line 
                                x1={x1} y1={y1} x2={x2} y2={y2} 
                                stroke={edge.color || data.textColor} 
                                strokeWidth="2" 
                                strokeDasharray="5,5"
                            />
                            {edge.label && (
                                <text x={(x1+x2)/2} y={(y1+y2)/2 - 10} fill={data.textColor} textAnchor="middle" fontSize={24}>
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {nodes.map((node, i) => {
                const nx = toPx(node.x, width);
                const ny = toPx(node.y, height);
                
                // Pop in animation
                const scale = spring({ 
                    frame: frame - (i * 10), 
                    fps, 
                    config: { stiffness: 200, damping: 15 } 
                });

                // Highlight animation check
                const activeHighlight = actions.find(a => 
                    a.type === 'highlight' && 
                    a.targetId === node.id && 
                    frame >= a.startDelay && 
                    frame < a.startDelay + a.duration
                );
                
                const highlightScale = activeHighlight ? 1.2 : 1.0;
                const finalScale = interpolate(scale, [0, 1], [0, 1]) * highlightScale;

                const nodeColor = node.color || data.textColor;

                return (
                    <div 
                        key={node.id}
                        style={{
                            position: 'absolute',
                            left: nx,
                            top: ny,
                            transform: `translate(-50%, -50%) scale(${finalScale})`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10
                        }}
                    >
                        {/* Render Icon based on Type */}
                        <div style={{
                            width: baseSize * 2,
                            height: baseSize * 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#1e293b',
                            borderRadius: node.type === 'client' ? '50%' : '12px',
                            border: `2px solid ${nodeColor}`,
                            boxShadow: activeHighlight ? `0 0 30px ${nodeColor}` : `0 0 10px rgba(0,0,0,0.5)`,
                            transition: 'box-shadow 0.2s',
                            position: 'relative'
                        }}>
                             <svg width="60%" height="60%" viewBox="0 0 40 40" fill="none" stroke={nodeColor} strokeWidth="2">
                                {node.type === 'database' && <path d={DB_PATH} />}
                                {node.type === 'server' && <path d={SERVER_PATH} />}
                                {node.type === 'client' && <path d={USER_PATH} />}
                                {node.type === 'lock' && (
                                    <>
                                      <path d={LOCK_SHACKLE_PATH} />
                                      <path d={LOCK_BODY_PATH} fill={nodeColor} stroke="none"/>
                                    </>
                                )}
                                {node.type === 'code' && (
                                    <text x="5" y="25" fontSize="30" fill={nodeColor} stroke="none">{`</>`}</text>
                                )}
                             </svg>
                        </div>

                        {/* Label */}
                        <div style={{
                            marginTop: 10,
                            color: nodeColor,
                            fontWeight: 'bold',
                            fontSize: '24px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}>
                            {node.label}
                        </div>
                    </div>
                );
            })}

            {/* Animations (Packets & Labels) */}
            {actions.map((action, i) => {
                if (frame < action.startDelay) return null;
                if (frame > action.startDelay + action.duration && action.type === 'packet') return null; // Packets disappear

                // --- PACKET FLOW ---
                if (action.type === 'packet' && action.fromId && action.toId) {
                    const from = nodes.find(n => n.id === action.fromId);
                    const to = nodes.find(n => n.id === action.toId);
                    if (!from || !to) return null;

                    const p = (frame - action.startDelay) / action.duration;
                    const progress = Math.min(Math.max(p, 0), 1); // Clamp 0-1

                    // Current Position
                    const startX = toPx(from.x, width);
                    const startY = toPx(from.y, height);
                    const endX = toPx(to.x, width);
                    const endY = toPx(to.y, height);
                    
                    const curX = interpolate(progress, [0, 1], [startX, endX]);
                    const curY = interpolate(progress, [0, 1], [startY, endY]);

                    const packetColor = action.color || '#ffffff';

                    return (
                        <div
                            key={`act-${i}`}
                            style={{
                                position: 'absolute',
                                left: curX,
                                top: curY,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: packetColor,
                                padding: '8px 16px',
                                borderRadius: '20px',
                                color: '#000',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                zIndex: 20,
                                boxShadow: `0 0 15px ${packetColor}`,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {action.label || 'DATA'}
                        </div>
                    );
                }

                // --- SHOW LABEL / POPUP ---
                if (action.type === 'show_label' && action.targetId) {
                    const target = nodes.find(n => n.id === action.targetId);
                    if (!target) return null;

                    const tx = toPx(target.x, width);
                    const ty = toPx(target.y, height);

                    // Spring pop-up for label
                    const labelPop = spring({
                        frame: frame - action.startDelay,
                        fps,
                        config: { stiffness: 150 }
                    });

                    return (
                        <div
                             key={`act-${i}`}
                             style={{
                                 position: 'absolute',
                                 left: tx + (baseSize),
                                 top: ty - (baseSize),
                                 transform: `scale(${labelPop})`,
                                 backgroundColor: action.color || '#10B981',
                                 color: '#fff',
                                 padding: '6px 12px',
                                 borderRadius: '6px',
                                 fontSize: '20px',
                                 fontWeight: 'bold',
                                 zIndex: 30,
                                 boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                             }}
                        >
                            {action.label}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};