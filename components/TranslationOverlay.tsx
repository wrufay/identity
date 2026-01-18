import { Audio } from 'expo-av';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TranslationOverlayProps {
  translation: string;
  pronunciation: string;
  english: string;
  isScanning?: boolean;
}

const API_URL = 'https://identitybackend-production-ebf0.up.railway.app';

export default function TranslationOverlay({
  translation,
  pronunciation,
  english,
  isScanning = false,
}: TranslationOverlayProps) {
  useEffect(() => {
    if (!isScanning && translation) {
      playPronunciation(translation);
    }
  }, [translation, isScanning]);

  const playPronunciation = async (text: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.audio) {
        throw new Error('Failed to get audio');
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${data.audio}` }
      );

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Audio error:', error);
    }
  };

  if (isScanning) {
    return <Text style={styles.scanningText}>...</Text>;
  }

  return (
    <View style={styles.content}>
      <Text style={styles.translation}>{translation}</Text>
      <Text style={styles.pinyin}>{pronunciation}</Text>
      <Text style={styles.english}>{english}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  translation: {
    fontSize: 64,
    color: '#ffd166',
    fontFamily: 'ZCOOLKuaiLe_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  pinyin: {
    fontSize: 24,
    color: '#fefadc',
    marginTop: 12,
    fontFamily: 'Lexend_400Regular',
    
    letterSpacing: 1.5,
  },
  english: {
    fontSize: 18,
    color: '#fefadc',
    marginTop: 8,
    fontFamily: 'NanumPenScript_400Regular',
    
  },
  scanningText: {
    color: '#fefadc',
    fontSize: 32,
    fontFamily: 'ZCOOLKuaiLe_400Regular',
    
  },
});
