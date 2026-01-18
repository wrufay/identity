import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommitmentLevel, COMMITMENT_LABELS, UserPrefs } from '@/services/userPreferences';

export default function CommitmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CommitmentLevel | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const commitmentOptions: CommitmentLevel[] = [
    '1_2_hours',
    '3_5_hours',
    '6_10_hours',
    '11_15_hours',
    '15_plus_hours',
  ];

  const handleComplete = async () => {
    if (!selected || isCompleting) return;
    
    setIsCompleting(true);
    
    try {
      const prefs = await UserPrefs.getPreferences();
      
      // Complete onboarding with all selections
      await UserPrefs.completeOnboarding(
        prefs.proficiencyLevel!,
        prefs.learningGoal!,
        selected
      );
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How much time can you commit?</Text>
        <Text style={styles.subtitle}>
          We'll adapt the learning pace to match your schedule
        </Text>

        <View style={styles.options}>
          {commitmentOptions.map((commitment) => {
            const label = COMMITMENT_LABELS[commitment];
            return (
              <TouchableOpacity
                key={commitment}
                style={[styles.option, selected === commitment && styles.selectedOption]}
                onPress={() => setSelected(commitment)}
              >
                <Text style={styles.optionEmoji}>{label.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{label.title}</Text>
                  <Text style={styles.optionDescription}>{label.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isCompleting}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.completeButton, (!selected || isCompleting) && styles.disabledButton]}
            onPress={handleComplete}
            disabled={!selected || isCompleting}
          >
            <Text style={styles.completeButtonText}>
              {isCompleting ? 'Setting up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>3 of 3</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 32,
    lineHeight: 24,
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252, 211, 77, 0.1)',
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#AAA',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#FCD34D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  progressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
});
