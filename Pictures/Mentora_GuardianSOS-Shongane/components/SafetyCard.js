import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AnimatedCircularProgress from './AnimatedCircularProgress';
import useSafetySpeech from '../hooks/useSafetySpeech';


const SafetyCard = () => {
  const [safetyScore, setSafetyScore] = useState(100);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calculate safety score based on incidents
  const calculateSafetyScore = (incidentsData) => {
    if (!incidentsData || incidentsData.length === 0) return 100;

    let score = 100;
    
    incidentsData.forEach(incident => {
      switch (incident.dangerLevel) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
        default:
          score -= 5;
      }
    });

    // Ensure score doesn't go below 0
    return Math.max(0, Math.min(100, score));
  };

  // Fetch incidents from API
  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://baroscopical-natosha-overrigid.ngrok-free.dev/api/incidents');
      const data = await response.json();
      
      setIncidents(data);
      const newSafetyScore = calculateSafetyScore(data);
      setSafetyScore(newSafetyScore);
      
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setSafetyScore(100); // Default to safe if API fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchIncidents, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getSafetyMessage = (score) => {
    if (score >= 80) return 'Excellent safety rating';
    if (score >= 60) return 'Good safety rating';
    if (score >= 40) return 'Moderate safety rating';
    return 'Low safety rating - Stay alert';
  };

  if (loading) {
    return (
      <View style={[styles.statCard, styles.safetyScore]}>
        <Text style={styles.loadingText}>Calculating safety...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.statCard, styles.safetyScore]}>
      <AnimatedCircularProgress 
        percentage={safetyScore} 
        size={100}
        strokeWidth={8}
        duration={2000}
      />
      <Text style={[styles.statLabel, styles.safetyScoreLabel]}>
        {getSafetyMessage(safetyScore)}
      </Text>
      <Text style={styles.incidentCount}>
        {incidents.length} incident(s) reported in your area
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    margin: 8,
  },
  safetyScore: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  safetyScoreLabel: {
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  incidentCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SafetyCard;