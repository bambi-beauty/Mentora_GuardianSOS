// services/geminiService.js
import { GEMINI_API_KEY, GEMINI_API_URL } from './config';

export async function fetchClosestCities(city) {
  try {
    const prompt = `
      List 3 closest cities or towns to ${city} in South Africa
      as a JSON array of strings. Only return the JSON array, for example:
      ["Johannesburg", "Krugersdorp", "Roodepoort"]
    `;

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100,
        },
      }),
    });

    const data = await response.json();

    // Gemini responses look like:
    // {
    //   "candidates": [
    //     {
    //       "content": {
    //         "parts": [{ "text": "[\"City1\", \"City2\"]" }]
    //       }
    //     }
    //   ]
    // }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      console.warn('Gemini returned no text');
      return [];
    }

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      console.warn('Gemini response was not an array:', text);
      return [];
    } catch (err) {
      console.warn('Failed to parse Gemini JSON:', text);
      return [];
    }
  } catch (error) {
    console.warn('Gemini fetchClosestCities error:', error);
    return [];
  }
}
 