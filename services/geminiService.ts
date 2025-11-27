import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeminiResponse } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const nodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { 
      type: Type.STRING, 
      enum: ['database', 'server', 'client', 'code', 'lock', 'queue', 'cloud', 'firewall'],
      description: "Map real-world concepts to these tech analogies. e.g. A 'Pot' is a 'server'. A 'Fridge' is a 'database'."
    },
    label: { type: Type.STRING, description: "Display name (e.g. 'Rice Cooker')" },
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
    type: { type: Type.STRING, enum: ['packet', 'highlight', 'show_label', 'pulse'] },
    startDelay: { type: Type.INTEGER, description: "Frame delay from scene start (approx 30fps)" },
    duration: { type: Type.INTEGER, description: "Duration of animation in frames" },
    fromId: { type: Type.STRING, nullable: true, description: "Required for 'packet'" },
    toId: { type: Type.STRING, nullable: true, description: "Required for 'packet'" },
    targetId: { type: Type.STRING, nullable: true, description: "Required for 'highlight', 'pulse' or 'show_label'" },
    label: { type: Type.STRING, nullable: true },
    color: { type: Type.STRING, nullable: true },
  },
  required: ['type', 'startDelay', 'duration']
};

const sceneSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    backgroundColor: { type: Type.STRING },
    textColor: { type: Type.STRING },
    durationInFrames: { type: Type.INTEGER },
    type: {
      type: Type.STRING,
      enum: ['intro', 'bullet_point', 'quote', 'outro', 'tech_diagram'],
    },
    diagramConfig: {
      type: Type.OBJECT,
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
    suggestedMusicMood: { type: Type.STRING },
    scenes: { type: Type.ARRAY, items: sceneSchema },
  },
  required: ["scenes", "suggestedMusicMood"],
};

export const generateVideoScript = async (topic: string, durationSeconds: number = 30): Promise<GeminiResponse> => {
  const model = "gemini-2.5-flash";
  const targetScenes = Math.max(3, Math.floor(durationSeconds / 6)); // Longer scenes for tech diagrams

  const prompt = `
# ROLE: High-End Motion Graphics Director (Cyberpunk / Technical Style)

You are designing a high-tech, animated system diagram video. Your goal is to visualize ANY topic (even cooking or daily life) as a sophisticated **Distributed System Architecture**.

## CORE VISUAL METAPHOR
Treat every topic as a computing system.
- **Cooking Curry** -> A Data Processing Pipeline. Ingredients are Data Packets. The Pot is a Server. The Recipe is Code.
- **Logistics** -> Network Routing Topology.
- **Finance** -> Transactional Database Locking.

## STRICT SCENE REQUIREMENTS

1.  **VISUAL STYLE**: 
    - Dark mode is MANDATORY. Backgrounds: #0B0F19, #111827.
    - Accents: Neon Cyan (#06b6d4), Neon Purple (#8b5cf6), Neon Green (#10b981).
    - Text: High contrast white/slate.

2.  **TECH_DIAGRAM RULES (CRITICAL)**:
    - **NEVER** return empty 'edges' or 'actions'. A diagram without movement is broken.
    - **NODES**: Create 3-6 nodes. Map them to tech types:
        - Storage/Containers -> 'database'
        - Processors/Workers -> 'server'
        - Users/Consumers -> 'client'
        - Rules/Recipes -> 'code'
        - Security/Gatekeepers -> 'lock' or 'firewall'
    - **EDGES**: Connect the nodes logically. 
        - Example: Client -> connects to -> Server. Server -> connects to -> Database.
    - **ACTIONS**: Orchestrate a "Data Flow".
        - Phase 1 (Frame 10-30): 'highlight' nodes to introduce them.
        - Phase 2 (Frame 30-80): 'packet' flow. Packets MUST travel along edges (fromId -> toId).
        - Phase 3 (Frame 80-120): 'pulse' or 'show_label' to show the result (e.g., "Done", "200 OK").

## TOPIC: "${topic}"
Target Duration: ${durationSeconds}s (~${targetScenes} scenes)

## OUTPUT JSON STRUCTURE
Generate a JSON response matching the schema. 
If the user asks for "Curry", do NOT just list ingredients. SHOW THE PROCESS.
- Scene 1: Intro
- Scene 2: "Ingredient Acquisition" (Client sends request to Fridge DB)
- Scene 3: "Processing Pipeline" (Server [Pot] processes Data [Meat/Veg] with Code [Heat])
- Scene 4: Outro

BE CREATIVE. BE TECHNICAL. MAKE IT MOVE.
`;

  try {
    const result = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Creativity allowed for metaphors
      },
    });

    const text = result.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text) as GeminiResponse;
    
    // Post-processing to ensure stability
    data.scenes = data.scenes.map(scene => {
      if (scene.type === 'tech_diagram') {
         scene.diagramConfig = scene.diagramConfig || { nodes: [], edges: [], actions: [] };
         scene.diagramConfig.nodes = scene.diagramConfig.nodes || [];
         scene.diagramConfig.edges = scene.diagramConfig.edges || [];
         scene.diagramConfig.actions = scene.diagramConfig.actions || [];
      }
      return scene;
    });

    return data;
  } catch (error) {
    console.error("Error generating video script:", error);
    throw error;
  }
};