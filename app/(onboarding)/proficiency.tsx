import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProficiencyLevel, PROFICIENCY_LABELS, UserPrefs } from '@/services/userPreferences';

export default function ProficiencyScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<ProficiencyLevel | null>(null);

  const proficiencyOptions: ProficiencyLevel[] = [
    'absolute_beginner',
    'beginner',
    'intermediate',
    'advanced',
    'fluent',
  ];

  const handleContinue = async () => {
    if (!selected) return;
    
    await UserPrefs.updatePreferences({ proficiencyLevel: selected });
    router.push('/(onboarding)/goals');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What's your Chinese level?</Text>
        <Text style={styles.subtitle}>
          This helps us tailor content to your proficiency
        </Text>

        <View style={styles.options}>
          {proficiencyOptions.map((level) => {
            const label = PROFICIENCY_LABELS[level];
            return (
              <TouchableOpacity
                key={level}
                style={[styles.option, selected === level && styles.selectedOption]}
                onPress={() => setSelected(level)}
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
        <TouchableOpacity
          style={[styles.continueButton, !selected && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>1 of 3</Text>
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
  continueButton: {
    backgroundColor: '#FCD34D',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  continueButtonText: {
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
