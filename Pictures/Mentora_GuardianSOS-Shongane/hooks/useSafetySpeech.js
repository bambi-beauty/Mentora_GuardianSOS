import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

const useSafetySpeech = (safetyScore, incidents) => {
  const lastSpeechScore = useRef(100);

  useEffect(() => {
    const speakSafetyUpdate = () => {
      let message = '';
      
      if (safetyScore >= 80) {
        message = 'Safety is excellent in your area.';
      } else if (safetyScore >= 60) {
        message = 'Safety is good. Stay aware of your surroundings.';
      } else if (safetyScore >= 40) {
        message = 'Moderate safety level. Please be cautious.';
      } else {
        message = 'Low safety rating. Stay alert and avoid risky areas.';
      }

      if (incidents.length > 0) {
        message += ` There are ${incidents.length} reported incidents nearby.`;
      }

      Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    };

    // Speak only when safety score changes significantly or every 5 minutes
    const scoreDifference = Math.abs(safetyScore - lastSpeechScore.current);
    if (scoreDifference >= 10) {
      speakSafetyUpdate();
      lastSpeechScore.current = safetyScore;
    }
  }, [safetyScore, incidents]);

  // Regular 5-minute reminders
  useEffect(() => {
    const interval = setInterval(() => {
      let message = '';
      
      if (safetyScore >= 80) {
        message = 'Safety reminder: Your area remains safe.';
      } else if (safetyScore >= 60) {
        message = 'Safety reminder: Conditions are good. Stay aware.';
      } else if (safetyScore >= 40) {
        message = 'Safety reminder: Exercise caution in your area.';
      } else {
        message = 'Safety reminder: High alert. Please stay vigilant.';
      }

      Speech.speak(message, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [safetyScore]);
};

export default useSafetySpeech;