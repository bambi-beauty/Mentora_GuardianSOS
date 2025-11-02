// services/newsStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@news_articles';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

export async function saveNewsCache({ articles, query, cities }) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        articles,
        query,
        cities,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Failed to save news cache', error);
  }
}

export async function loadNewsCache() {
  try {
    const jsonString = await AsyncStorage.getItem(STORAGE_KEY);
    if (!jsonString) return null;

    const saved = JSON.parse(jsonString);
    if (!saved.timestamp || Date.now() - saved.timestamp > CACHE_EXPIRY_MS) {
      // Cache expired
      return null;
    }
    return saved;
  } catch (error) {
    console.warn('Failed to load news cache', error);
    return null;
  }
}

export async function clearNewsCache() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear news cache', error);
  }
}
