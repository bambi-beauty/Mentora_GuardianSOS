import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const analyzeIncident = async (incident) => {
  const prompt = `
You are a community safety AI.
Analyze this incident and classify the danger level (low, medium, high) based on severity, type, and location.
Respond in JSON format.

Incident Details:
Type: ${incident.type}
Location: ${incident.locationText || 'N/A'}
Description: ${incident.description}
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const parsed = JSON.parse(text);
    return parsed; 
  } catch {
    return { dangerLevel: 'medium', reason: 'Default classification' };
  }
};
