import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';

interface TranslationOverlayProps {
  translation: string;
  pronunciation: string;
  english: string;
  culturalContext?: string;
  isScanning?: boolean;
}

const API_URL = 'https://identitybackend-production-ebf0.up.railway.app';

export default function TranslationOverlay({
  translation,
  pronunciation,
  english,
  culturalContext,
  isScanning = false,
}: TranslationOverlayProps) {

  const [dots, setDots] = useState('.');
  const [definition, setDefinition] = useState<string | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  // 0 = show translation, 1 = show cultural context, 2 = hide everything
  const [viewState, setViewState] = useState(0);

  useEffect(() => {
    if (!isScanning && translation) {
      playPronunciation(translation);
    }
  }, [translation, isScanning]);


  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const playPronunciation = async (text: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('TTS API error:', response.status);
        return;
      }

      const data = await response.json();

      if (!data.audio) {
        console.error('No audio data in response');
        return;
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
      // Silently fail - don't crash the app if TTS fails
    }
  };

  const fetchDefinition = async () => {
    if (definition) {
      // If definition is already loaded, close it
      setShowDefinition(false);
      setDefinition(null);
      return;
    }

    setLoadingDefinition(true);
    try {
      const response = await fetch(`${API_URL}/api/definition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: english }),
      });

      if (!response.ok) {
        console.error('Definition API error:', response.status);
        setLoadingDefinition(false);
        return;
      }

      const data = await response.json();
      setDefinition(data.definition || 'No definition available');
      setShowDefinition(true);
      setLoadingDefinition(false);
    } catch (error) {
      console.error('Definition fetch error:', error);
      setDefinition('Unable to fetch definition');
      setShowDefinition(true);
      setLoadingDefinition(false);
    }
  };

  if (isScanning) {
    return <Text style={styles.scanningText}>{dots}</Text>;
  }

  const handleScreenTap = () => {
    // Cycle through: 0 (translation) -> 1 (cultural context) -> 2 (hidden) -> back to parent
    setViewState((prev) => (prev + 1) % 3);
  };

  // If viewState is 2 (hide everything), return null to make the overlay disappear
  if (viewState === 2) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={handleScreenTap}
      activeOpacity={1}
      style={{ maxHeight: '80%', alignItems: 'center', width: '100%' }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
      >
        {viewState === 0 && (
          <>
            <Text style={styles.translation}>{translation}</Text>
            <Text style={styles.pinyin}>{pronunciation}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                fetchDefinition();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.english}>{english}</Text>
            </TouchableOpacity>
            {loadingDefinition && (
              <View style={styles.definitionBubble}>
                <ActivityIndicator color="#7c6a0a" />
              </View>
            )}
            {showDefinition && definition && !loadingDefinition && (
              <View style={styles.definitionBubble}>
                <Text style={styles.definitionText}>{definition}</Text>
              </View>
            )}
          </>
        )}
        {viewState === 1 && culturalContext && culturalContext.length > 0 && (
          <View style={styles.culturalBubble}>
            <Text style={styles.culturalContext}>{culturalContext}</Text>
          </View>
        )}
      </ScrollView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  english: {
    fontSize: 26,
    color: '#fefadc',
    marginTop: 8,
    fontFamily: 'NanumPenScript_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  definitionBubble: {
    marginTop: 16,
    backgroundColor: "rgba(254, 250, 220, 0.6)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#ffd16680',
    maxWidth: '90%',
    minHeight: 50,
    justifyContent: 'center',
  },
  definitionText: {
    fontSize: 15,
    color: '#7c6a0a',
    fontFamily: 'Lexend_300Light',
    lineHeight: 22,
    textAlign: 'center',
  },
  culturalBubble: {
    marginTop: 20,
    backgroundColor: "rgba(254, 250, 220, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: '#ffd166',
    width: '90%',
    alignSelf: 'center',
  },
  culturalContext: {
    fontSize: 15,
    color: '#7c6a0a',
    fontFamily: 'Lexend_300Light',
    lineHeight: 22,
    textAlign: 'center',
  },
  scanningText: {
    color: '#fefadc',
    fontSize: 32,
    fontFamily: 'ZCOOLKuaiLe_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
});
