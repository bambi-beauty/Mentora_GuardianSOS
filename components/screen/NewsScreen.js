import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
  TextInput,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import styles from './CommunityStyles';
import { useUser } from '../../Users/useContext';

import { fetchClosestCities } from '../../services/geminiService.js';
import { loadNewsCache, saveNewsCache } from '../../services/newsStorage';
import { NEWS_API_KEY } from '../../services/config.js';

const crimeKeywords = ['crime', 'theft', 'burglary', 'kidnapping', 'corruption', 'murder', 'robbery'];

const NewsScreen = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [closestCities, setClosestCities] = useState([]);
  const { selectedCity } = useUser();

  const fetchNews = async (query, cities) => {
    setLoading(true);
    try {
      const city = selectedCity || 'South Africa';
      const cityList = cities && cities.length > 0 ? [city, ...cities] : [city];
      const citiesQuery = cityList.join(' OR ');
      const crimeQuery = crimeKeywords.join(' OR ');

      const searchTerm = query
        ? `${citiesQuery} ${crimeQuery} ${query}`
        : `${citiesQuery} ${crimeQuery}`;

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          searchTerm
        )}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`
      );

      const data = await response.json();

      if (data.status === 'ok') {
        setArticles(data.articles || []);
        await saveNewsCache({ articles: data.articles, query, cities });
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const prepareNews = async () => {
      setLoading(true);

      // Load cached news
      const cache = await loadNewsCache();
      if (cache) {
        setArticles(cache.articles || []);
        setSearchQuery(cache.query || '');
        setClosestCities(cache.cities || []);
      }

      // Fetch closest cities using Gemini
      const cities = await fetchClosestCities(selectedCity || 'South Africa');
      setClosestCities(cities);

      // Fetch fresh news if no cache or cache expired
      if (!cache) {
        await fetchNews('', cities);
      }

      setLoading(false);
    };

    prepareNews();
  }, [selectedCity]);

  const handleSearch = () => {
    fetchNews(searchQuery, closestCities);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          paddingHorizontal: 12,
          paddingVertical: 8,
          margin: 15,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <FontAwesome name="search" size={18} color="#888" />
        <TextInput
          style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#333' }}
          placeholder={`Search ${selectedCity || 'South Africa'} crime news...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <FontAwesome name="arrow-right" size={20} color="#2A5B8C" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        📰 Latest Crime News in {selectedCity || 'Your Area'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2A5B8C" style={{ marginTop: 30 }} />
      ) : articles.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20, color: '#555' }}>
          No recent crime-related news found for {selectedCity || 'this area'}.
        </Text>
      ) : (
        articles.map((article, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.postCard, { margin: 10, marginBottom: 15 }]}
            onPress={() => Linking.openURL(article.url)}
          >
            {article.urlToImage && (
              <Image
                source={{ uri: article.urlToImage }}
                style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 10 }}
              />
            )}
            <Text style={styles.postUser}>{article.title}</Text>
            {article.description ? <Text style={styles.postText}>{article.description}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <FontAwesome name="clock-o" size={14} color="#888" />
              <Text style={{ fontSize: 12, color: '#888', marginLeft: 5 }}>
                {new Date(article.publishedAt).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default NewsScreen;
