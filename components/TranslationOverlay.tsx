import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AdditionalContextModal from './AdditionalContextModal';

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

  const [showAdditionalContext, setShowAdditionalContext] = useState(false);
  const [dots, setDots] = useState('.');

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

  if (isScanning) {
    return <Text style={styles.scanningText}>{dots}</Text>;
  }

  return (
    <>
      <View style={styles.content}>
        <Text style={styles.translation}>{translation}</Text>
        <Text style={styles.pinyin}>{pronunciation}</Text>
        <Text style={styles.english}>{english}</Text>
        
        {/* What else? Button */}
        <TouchableOpacity 
          style={styles.whatElseButton}
          onPress={() => setShowAdditionalContext(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.whatElseButtonText}>What else? 💡</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Context Modal */}
      <AdditionalContextModal
        visible={showAdditionalContext}
        onClose={() => setShowAdditionalContext(false)}
        itemEnglish={english}
        itemChinese={translation}
      />
    </>
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
  culturalContext: {
    fontSize: 14,
    color: '#fefadc',
    marginTop: 16,
    fontFamily: 'Lexend_300Light',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    opacity: 0.9,
  },
  whatElseButton: {
    marginTop: 24,
    backgroundColor: 'rgba(252, 211, 77, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  whatElseButtonText: {
    color: '#FCD34D',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Lexend_600SemiBold',
  },
  scanningText: {
    color: '#fefadc',
    fontSize: 32,
    fontFamily: 'ZCOOLKuaiLe_400Regular',
  },
});
