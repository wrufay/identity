import { AdditionalContextResponse, generateAdditionalContext } from '@/services/backboardService';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AdditionalContextModalProps {
  visible: boolean;
  onClose: () => void;
  itemEnglish: string;
  itemChinese: string;
}

const API_URL = 'https://identitybackboard-production-ebf0.up.railway.app';

export default function AdditionalContextModal({
  visible,
  onClose,
  itemEnglish,
  itemChinese,
}: AdditionalContextModalProps) {
  const [context, setContext] = useState<AdditionalContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible && itemEnglish && itemChinese) {
      fetchAdditionalContext();
    } else {
      // Reset state when modal closes
      setContext(null);
      setError(false);
    }
  }, [visible, itemEnglish, itemChinese]);

  const fetchAdditionalContext = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const result = await generateAdditionalContext(itemEnglish, itemChinese);
      
      if (result) {
        setContext(result);
        // Auto-play pronunciation when content loads
        playPronunciation(result.sentence);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch additional context:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = async (text: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok || !data.audio) {
        console.error('Failed to get audio');
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
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4ADE80';
      case 'medium': return '#FCD34D';
      case 'hard': return '#F87171';
      default: return '#FCD34D';
    }
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '🌱';
      case 'medium': return '🌿';
      case 'hard': return '🌳';
      default: return '💡';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>What else?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FCD34D" />
                <Text style={styles.loadingText}>Generating content...</Text>
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorEmoji}>😕</Text>
                <Text style={styles.errorText}>
                  Couldn't generate additional content. Try again?
                </Text>
                <TouchableOpacity 
                  onPress={fetchAdditionalContext}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {context && !loading && (
              <View style={styles.contextContainer}>
                {/* Difficulty Badge */}
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyEmoji}>
                    {getDifficultyEmoji(context.difficulty)}
                  </Text>
                  <Text 
                    style={[
                      styles.difficultyText,
                      { color: getDifficultyColor(context.difficulty) }
                    ]}
                  >
                    {context.difficulty?.toUpperCase()}
                  </Text>
                </View>

                {/* Chinese Sentence */}
                <TouchableOpacity 
                  onPress={() => playPronunciation(context.sentence)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sentence}>{context.sentence}</Text>
                </TouchableOpacity>

                {/* Pinyin */}
                <Text style={styles.pinyin}>{context.pinyin}</Text>

                {/* English Translation */}
                <Text style={styles.english}>{context.english}</Text>

                {/* Explanation */}
                {context.explanation && (
                  <View style={styles.explanationContainer}>
                    <Text style={styles.explanationLabel}>💡 Why this matters:</Text>
                    <Text style={styles.explanationText}>{context.explanation}</Text>
                  </View>
                )}

                {/* Replay button */}
                <TouchableOpacity 
                  onPress={() => playPronunciation(context.sentence)}
                  style={styles.replayButton}
                >
                  <Text style={styles.replayButtonText}>🔊 Listen Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FCD34D',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(252, 211, 77, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD34D',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  contextContainer: {
    alignItems: 'center',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 8,
  },
  difficultyEmoji: {
    fontSize: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sentence: {
    fontSize: 32,
    color: '#FCD34D',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  pinyin: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  english: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  explanationContainer: {
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  explanationLabel: {
    fontSize: 14,
    color: '#FCD34D',
    fontWeight: '600',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#DDD',
    lineHeight: 20,
  },
  replayButton: {
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  replayButtonText: {
    color: '#FCD34D',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#FCD34D',
    padding: 18,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
});
