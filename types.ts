export interface SceneData {
  title: string;
  subtitle: string;
  backgroundColor: string;
  textColor: string;
  durationInFrames: number;
  type: 'intro' | 'bullet_point' | 'quote' | 'outro' | 'tech_diagram';
  // Optional configuration for tech diagrams
  diagramConfig?: DiagramConfig;
}

export type NodeType = 'database' | 'server' | 'client' | 'code' | 'lock';

export interface DiagramNode {
  id: string;
  type: NodeType;
  label: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  color?: string; // Hex override
}

export interface DiagramEdge {
  fromId: string;
  toId: string;
  label?: string;
  color?: string;
}

export interface DiagramAction {
  type: 'packet' | 'highlight' | 'show_label';
  startDelay: number; // Frames relative to scene start
  duration: number;
  fromId?: string; // For packet
  toId?: string;   // For packet
  targetId?: string; // For highlight/show_label
  label?: string; // Text for packet or label
  color?: string;
}

export interface DiagramConfig {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  actions: DiagramAction[];
}

export interface VideoConfig {
  topic: string;
  musicMood: string;
  totalDuration: number;
  scenes: SceneData[];
  width: number;
  height: number;
  fps: number;
}

export interface GeminiResponse {
  scenes: SceneData[];
  suggestedMusicMood: string;
}