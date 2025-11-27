import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiResponse } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const nodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['database', 'server', 'client', 'code', 'lock'] },
    label: { type: Type.STRING },
    x: { type: Type.NUMBER, description: "X Position (0-100). 50 is center." },
    y: { type: Type.NUMBER, description: "Y Position (0-100). 50 is center." },
    color: { type: Type.STRING, nullable: true },
  },
  required: ['id', 'type', 'label', 'x', 'y']
};

const edgeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fromId: { type: Type.STRING },
    toId: { type: Type.STRING },
    label: { type: Type.STRING, nullable: true },
    color: { type: Type.STRING, nullable: true },
  },
  required: ['fromId', 'toId']
};

const actionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['packet', 'highlight', 'show_label'] },
    startDelay: { type: Type.INTEGER, description: "Frame delay from scene start (approx 30fps)" },
    duration: { type: Type.INTEGER, description: "Duration of animation in frames" },
    fromId: { type: Type.STRING, nullable: true, description: "Required for 'packet'" },
    toId: { type: Type.STRING, nullable: true, description: "Required for 'packet'" },
    targetId: { type: Type.STRING, nullable: true, description: "Required for 'highlight' or 'show_label'" },
    label: { type: Type.STRING, nullable: true },
    color: { type: Type.STRING, nullable: true },
  },
  required: ['type', 'startDelay', 'duration']
};

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "VERY SHORT title (max 4 words).",
    },
    subtitle: {
      type: Type.STRING,
      description: "Concise subtitle (max 10 words). NO FLUFF.",
    },
    backgroundColor: {
      type: Type.STRING,
      description: "Hex color code for the background (e.g. #1e293b). Ensure high contrast.",
    },
    textColor: {
      type: Type.STRING,
      description: "Hex color code for the text (e.g. #ffffff).",
    },
    durationInFrames: {
      type: Type.INTEGER,
      description: "Duration of the scene in frames (assume 30fps). Min 60, Max 150.",
    },
    type: {
      type: Type.STRING,
      enum: ['intro', 'bullet_point', 'quote', 'outro', 'tech_diagram'],
      description: "The visual style template. Use 'tech_diagram' for explaining technical concepts with nodes/servers.",
    },
    diagramConfig: {
      type: Type.OBJECT,
      description: "Configuration for 'tech_diagram' type scenes. Required if type is tech_diagram.",
      properties: {
        nodes: { type: Type.ARRAY, items: nodeSchema },
        edges: { type: Type.ARRAY, items: edgeSchema },
        actions: { type: Type.ARRAY, items: actionSchema },
      },
    },
  },
  required: ["title", "subtitle", "backgroundColor", "textColor", "durationInFrames", "type"],
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestedMusicMood: {
      type: Type.STRING,
      description: "A short description of the music mood suitable for this video.",
    },
    scenes: {
      type: Type.ARRAY,
      items: sceneSchema,
    },
  },
  required: ["scenes", "suggestedMusicMood"],
};

export const generateVideoScript = async (topic: string, durationSeconds: number = 30): Promise<GeminiResponse> => {
  const model = "gemini-2.5-flash";
  
  // Calculate approx number of scenes based on duration (avg 4-5 seconds per scene + transitions)
  const targetScenes = Math.max(3, Math.floor(durationSeconds / 5));

  const prompt = `
    You are a professional Motion Graphics Director specializing in technical explainers.
    Create a structured video script for a video about: "${topic}".
    
    CONSTRAINTS:
    1. Total Duration Target: ~${durationSeconds} seconds.
    2. Scene Count Target: ~${targetScenes} scenes.
    3. STYLE: Minimalist, Technical, Cyberpunk.
    4. TEXT: EXTREMELY CONCISE. No fluff. No long sentences. Use keywords.
       - BAD: "In this scene we will explore how the database connects to the server."
       - GOOD: "Database Connection" / "Handshake Protocol"
    
    CRITICAL: For technical explanations (how it works, architecture, flow), you MUST use the 'tech_diagram' scene type.
    
    When defining a 'tech_diagram':
    1. Define 'nodes' (Servers, Databases, Users) with x/y coordinates (0-100 scale). 50,50 is center.
    2. Define 'edges' connecting them.
    3. Define 'actions' to animate the flow. 
    
    Ensure the color palette is modern (dark mode technical aesthetic).
  `;

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text) as GeminiResponse;
    data.scenes = data.scenes.map(scene => {
      // Fallback: if tech_diagram is missing config, convert to bullet_point
      if (scene.type === 'tech_diagram') {
         if (!scene.diagramConfig) {
             scene.type = 'bullet_point';
         } else {
             // Ensure arrays exist
             scene.diagramConfig.nodes = scene.diagramConfig.nodes || [];
             scene.diagramConfig.edges = scene.diagramConfig.edges || [];
             scene.diagramConfig.actions = scene.diagramConfig.actions || [];
         }
      }
      return scene;
    });

    return data;
  } catch (error) {
    console.error("Error generating video script:", error);
    throw error;
  }
};