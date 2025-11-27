import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SceneData } from '../../types';

// --- HIGH QUALITY SVG PATHS (Cyberpunk Aesthetic) ---
const ICONS = {
    database: "M 0 5 A 20 6 0 1 1 40 5 L 40 30 A 20 6 0 1 1 0 30 Z M 0 5 A 20 6 0 1 0 40 5",
    server: "M 4 4 H 36 V 36 H 4 Z M 8 10 H 32 M 8 20 H 32 M 28 30 A 2 2 0 1 1 28 30.01",
    client: "M 20 10 A 8 8 0 1 1 20 26 A 8 8 0 1 1 20 10 M 10 38 Q 20 28 30 38",
    code: "M 10 20 L 2 10 L 10 0 M 30 0 L 38 10 L 30 20 M 18 25 L 22 -5", // Pseudo code brackets
    lock: "M 10 15 H 30 V 30 H 10 Z M 15 15 V 10 A 5 5 0 1 1 25 10 V 15",
    cloud: "M 10 25 Q 5 25 5 20 Q 5 10 15 10 Q 20 0 30 5 Q 40 0 45 10 Q 55 10 55 20 Q 55 25 50 25 Z",
    queue: "M 5 10 H 35 M 5 20 H 35 M 5 30 H 35 M 40 10 L 35 15 L 40 20",
    firewall: "M 4 4 H 36 V 36 H 4 Z M 4 4 L 36 36 M 36 4 L 4 36", // X box
};

interface TechSceneProps {
    data: SceneData;
}

export const TechScene: React.FC<TechSceneProps> = ({ data }) => {
    const frame = useCurrentFrame();
    const { width, height, fps } = useVideoConfig();
    
    if (!data.diagramConfig) return null;

    const { nodes = [], edges = [], actions = [] } = data.diagramConfig;
    
    // Config constants
    const baseSize = Math.min(width, height) * 0.06;
    const GRID_COLOR = 'rgba(255, 255, 255, 0.08)';
    
    // --- 3D TRANSFORM CONFIG ---
    // This gives that cool "Tabletop" look from the user's example
    const containerStyle: React.CSSProperties = {
        flex: 1,
        backgroundColor: data.backgroundColor || '#0f172a',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'JetBrains Mono, monospace',
        perspective: '1000px', // Crucial for 3D
    };

    const stageStyle: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        // Tilt the world back slightly
        transform: 'rotateX(20deg) scale(0.9)', 
    };

    const toPx = (pct: number, dim: number) => (pct / 100) * dim;

    return (
        <div style={containerStyle}>
            {/* --- 1. MOVING GRID BACKGROUND --- */}
            <div style={{
                position: 'absolute',
                top: '-100%', left: '-100%', width: '300%', height: '300%',
                backgroundImage: `
                    linear-gradient(${GRID_COLOR} 1px, transparent 1px), 
                    linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
                transform: `rotateX(60deg) translateY(${frame % 80}px) translateZ(-200px)`, // Moving grid effect
                opacity: 0.3,
            }} />

            <div style={stageStyle}>
                {/* --- 2. CONNECTIONS (EDGES) --- */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                         <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {edges.map((edge, i) => {
                        const from = nodes.find(n => n.id === edge.fromId);
                        const to = nodes.find(n => n.id === edge.toId);
                        if (!from || !to) return null;

                        const x1 = toPx(from.x, width);
                        const y1 = toPx(from.y, height);
                        const x2 = toPx(to.x, width);
                        const y2 = toPx(to.y, height);

                        // Reveal animation
                        const progress = spring({ frame: frame - (i * 3), fps, config: { stiffness: 50 } });
                        const opacity = interpolate(progress, [0, 1], [0, 0.4]);

                        return (
                            <g key={`edge-${i}`} opacity={opacity}>
                                {/* Base Line */}
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={edge.color || data.textColor} strokeWidth="2" strokeOpacity="0.3" />
                                {/* Label */}
                                {edge.label && (
                                    <text x={(x1+x2)/2} y={(y1+y2)/2 - 15} fill={data.textColor} textAnchor="middle" fontSize={20} opacity={0.7} style={{textShadow: '0 2px 4px black'}}>
                                        {edge.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* --- 3. NODES --- */}
                {nodes.map((node, i) => {
                    const nx = toPx(node.x, width);
                    const ny = toPx(node.y, height);
                    const nodeColor = node.color || '#3b82f6';

                    // Entrance Spring
                    const entrance = spring({ 
                        frame: frame - (i * 5), 
                        fps, 
                        config: { stiffness: 100, damping: 12 } 
                    });

                    // Active Interaction Highlight
                    const activeAction = actions.find(a => 
                        (a.type === 'highlight' || a.type === 'pulse') && 
                        a.targetId === node.id && 
                        frame >= a.startDelay && 
                        frame < a.startDelay + a.duration
                    );
                    
                    const isPulse = activeAction?.type === 'pulse';
                    const pulseScale = isPulse ? Math.sin((frame - activeAction.startDelay) * 0.5) * 0.1 : 0;
                    
                    const scaleVal = interpolate(entrance, [0, 1], [0, 1]) + (activeAction ? 0.15 : 0) + pulseScale;

                    return (
                        <div 
                            key={node.id}
                            style={{
                                position: 'absolute',
                                left: nx,
                                top: ny,
                                transform: `translate(-50%, -50%) scale(${scaleVal})`,
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transformStyle: 'preserve-3d', // Keep 3D context
                            }}
                        >
                            {/* Icon Container with Glow */}
                            <div style={{
                                width: baseSize * 2.2,
                                height: baseSize * 2.2,
                                borderRadius: node.type === 'client' ? '50%' : '16px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: `2px solid ${nodeColor}`,
                                boxShadow: `0 0 ${activeAction ? '40px' : '10px'} ${nodeColor}`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'box-shadow 0.3s',
                                position: 'relative',
                            }}>
                                <svg width="50%" height="50%" viewBox="0 0 40 40" style={{overflow: 'visible'}}>
                                    <path 
                                        d={ICONS[node.type as keyof typeof ICONS] || ICONS.server} 
                                        fill="none" 
                                        stroke={nodeColor} 
                                        strokeWidth="3" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        filter="drop-shadow(0 0 4px currentColor)"
                                    />
                                </svg>
                                
                                {/* Reflection Glint */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    borderRadius: 'inherit',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                                    pointerEvents: 'none'
                                }} />
                            </div>

                            {/* Node Label (Floating Billboard) */}
                            <div style={{
                                marginTop: '16px',
                                background: 'rgba(0,0,0,0.7)',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                color: nodeColor,
                                fontWeight: 700,
                                fontSize: '18px',
                                letterSpacing: '0.05em',
                                whiteSpace: 'nowrap',
                                textShadow: `0 0 10px ${nodeColor}`,
                                border: `1px solid ${nodeColor}44`,
                                transform: 'translateZ(20px)', // Float above
                            }}>
                                {node.label.toUpperCase()}
                            </div>
                        </div>
                    );
                })}

                {/* --- 4. PACKETS (ENERGY BOLTS) --- */}
                {actions.map((action, i) => {
                    if (action.type !== 'packet' || !action.fromId || !action.toId) return null;
                    if (frame < action.startDelay) return null;
                    if (frame > action.startDelay + action.duration) return null;

                    const from = nodes.find(n => n.id === action.fromId);
                    const to = nodes.find(n => n.id === action.toId);
                    if (!from || !to) return null;

                    // Use Spring for movement instead of linear for better "feel"
                    // We manually calculate progress 0-1 based on frame
                    const rawProgress = (frame - action.startDelay) / action.duration;
                    const progress = Math.min(Math.max(rawProgress, 0), 1);

                    const startX = toPx(from.x, width);
                    const startY = toPx(from.y, height);
                    const endX = toPx(to.x, width);
                    const endY = toPx(to.y, height);

                    const curX = interpolate(progress, [0, 1], [startX, endX]);
                    const curY = interpolate(progress, [0, 1], [startY, endY]);
                    const packetColor = action.color || '#fff';

                    return (
                        <div
                            key={`pkt-${i}`}
                            style={{
                                position: 'absolute',
                                left: curX,
                                top: curY,
                                transform: 'translate(-50%, -50%)',
                                zIndex: 20,
                            }}
                        >
                            {/* Glowing Orb */}
                            <div style={{
                                width: '16px', height: '16px',
                                background: packetColor,
                                borderRadius: '50%',
                                boxShadow: `0 0 20px 5px ${packetColor}`,
                            }} />
                            
                            {/* Label riding on packet */}
                            {action.label && (
                                <div style={{
                                    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                                    color: packetColor, fontWeight: 'bold', fontSize: '14px',
                                    textShadow: '0 2px 4px black', whiteSpace: 'nowrap'
                                }}>
                                    {action.label}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {/* --- 5. POPUP LABELS --- */}
                {actions.map((action, i) => {
                     if (action.type !== 'show_label' || !action.targetId) return null;
                     if (frame < action.startDelay) return null;

                     const target = nodes.find(n => n.id === action.targetId);
                     if (!target) return null;

                     // Pop In
                     const pop = spring({ frame: frame - action.startDelay, fps, config: { stiffness: 200 } });
                     const tx = toPx(target.x, width);
                     const ty = toPx(target.y, height);

                     return (
                        <div 
                            key={`lbl-${i}`}
                            style={{
                                position: 'absolute',
                                left: tx, top: ty - baseSize * 2,
                                transform: `translate(-50%, -50%) scale(${pop})`,
                                zIndex: 50,
                                background: action.color || '#10b981',
                                color: '#000',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                fontWeight: '900',
                                fontSize: '24px',
                                boxShadow: `0 5px 20px rgba(0,0,0,0.5)`,
                            }}
                        >
                            {action.label}
                        </div>
                     );
                })}
            </div>
            
            {/* --- 6. TITLE OVERLAY (2D HUD) --- */}
            <div style={{
                position: 'absolute',
                top: 40, left: 40,
                zIndex: 100,
                pointerEvents: 'none'
            }}>
                <h2 style={{
                    fontSize: '40px', fontWeight: 800, color: data.textColor,
                    textShadow: '0 4px 10px rgba(0,0,0,0.5)', margin: 0
                }}>
                    {data.title}
                </h2>
                <div style={{
                    height: '4px', width: '60px', background: data.textColor, marginTop: '8px'
                }} />
                <p style={{
                    fontSize: '24px', color: data.textColor, opacity: 0.8, marginTop: '8px'
                }}>
                    {data.subtitle}
                </p>
            </div>
        </div>
    );
};