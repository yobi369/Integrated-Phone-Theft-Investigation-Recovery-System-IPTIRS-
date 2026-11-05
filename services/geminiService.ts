
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { TacticalResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.STRING,
            description: "A tactical summary of the situation based on the query.",
        },
        target_coordinates: {
            type: Type.OBJECT,
            properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                location_name: { type: Type.STRING }
            },
            description: "Estimated or triangulated coordinates. For Kenya, Nairobi is approx -1.29, 36.82.",
        },
        signal_strength: {
            type: Type.INTEGER,
            description: "Signal confidence or strength percentage (0-100).",
        },
        recommended_action: {
            type: Type.STRING,
            description: "Specific instruction for officers (e.g., 'Deploy Unit', 'Set up perimeter').",
        },
        identified_suspects: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Potential suspects or gang affiliations if relevant.",
        }
    },
    required: ["analysis", "recommended_action"]
};

export const processNaturalLanguageQuery = async (query: string): Promise<TacticalResponse> => {
    console.log(`Processing command: "${query}"`);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                systemInstruction: `You are K-DART (Kenya Digital Asset Recovery & Tracking), an advanced AI specialized in assisting Kenya Police and Military.
                
                Your capabilities:
                1. Triangulate stolen devices (Phones, Laptops) using simulated signal data.
                2. Analyze theft patterns in Kenyan regions (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret).
                3. Provide tactical advice for recovery operations.
                
                Context:
                - If the user asks to "Track" or "Locate" a device, generate plausible coordinates near Nairobi (-1.2921, 36.8219) or the specific location mentioned.
                - Use authoritative, military-style language.
                - Assume access to IMEI databases and cell tower triangulation.
                
                Current Operational Date: October 2023.
                `,
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI Command.");
        
        return JSON.parse(text) as TacticalResponse;

    } catch (error) {
        console.error("Gemini Command Error:", error);
        return {
            analysis: "System communication error. Unable to process tactical request.",
            recommended_action: "Manual override required. Check network uplink.",
            signal_strength: 0
        };
    }
};
