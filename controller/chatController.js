// controller/chatController.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import ChatMessage from '../model/ChatMessage.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?._id;

    if (!message || !userId) {
      console.warn('Missing message or userId in request', { message, userId });
      return res.status(400).json({ error: 'Message and user are required.' });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      user: userId,
      role: 'user',
      content: message,
    });

    const historyDocs = await ChatMessage.find({ user: userId })
      .sort({ createdAt: 1 })
      .limit(20);

    console.log('History docs count:', historyDocs.length);

    const history = historyDocs.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    console.log('History payload for AI:', history);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);

    const responseText = result.response.text();
    console.log('Response from Gemini:', responseText);

    const modelMessage = await ChatMessage.create({
      user: userId,
      role: 'model',
      content: responseText,
    });

    return res.status(200).json({
      response: responseText,
      messages: [userMessage, modelMessage],
    });
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data || error.response);
    }
    return res.status(500).json({
      error: error.message || 'Internal server error during chat',
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    const messages = await ChatMessage.find({ user: userId }).sort({
      createdAt: 1,
    });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};


export const listModels = async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.status(200).json(models);
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
};