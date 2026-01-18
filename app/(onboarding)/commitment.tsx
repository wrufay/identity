import { Colors } from '@/constants/theme';
import { COMMITMENT_LABELS, CommitmentLevel, UserPrefs } from '@/services/userPreferences';
import { Lexend_400Regular, Lexend_600SemiBold, useFonts as useLexendFonts } from '@expo-google-fonts/lexend';
import { NanumPenScript_400Regular, useFonts as useNanumFonts } from '@expo-google-fonts/nanum-pen-script';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CommitmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CommitmentLevel | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const [nanumLoaded] = useNanumFonts({
    NanumPenScript_400Regular,
  });

  const [lexendLoaded] = useLexendFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
  });

  const fontsLoaded = nanumLoaded && lexendLoaded;

  const commitmentOptions: CommitmentLevel[] = [
    '1_2_hours',
    '3_5_hours',
    '6_10_hours',
    '11_15_hours',
    '15_plus_hours',
  ];

  const commitmentImages = {
    '1_2_hours': require('@/assets/images/1.png'),
    '3_5_hours': require('@/assets/images/2.png'),
    '6_10_hours': require('@/assets/images/3.png'),
    '11_15_hours': require('@/assets/images/4.png'),
    '15_plus_hours': require('@/assets/images/5.png'),
  };

  if (!fontsLoaded) {
    return null;
  }

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
                <Image
                  source={commitmentImages[commitment]}
                  style={styles.optionImage}
                />
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
    backgroundColor: Colors.peach,
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
    color: Colors.red,
    marginBottom: 12,
    fontFamily: 'Lexend_400Regular',
  },
  subtitle: {
    fontSize: 20,
    color: Colors.olive,
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'NanumPenScript_400Regular',
  },
  options: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    backgroundColor: Colors.green,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: Colors.red,
    backgroundColor: Colors.orange,
  },
  optionImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    opacity: 0.8,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.olive,
    marginBottom: 4,
    fontFamily: 'Lexend_600SemiBold',
  },
  optionDescription: {
    fontSize: 18,
    color: Colors.olive,
    fontFamily: 'NanumPenScript_400Regular',
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
    backgroundColor: Colors.green,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: Colors.red,
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.olive,
    fontFamily: 'Lexend_400Regular',
  },
  completeButton: {
    flex: 2,
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: Colors.red,
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  disabledButton: {
    backgroundColor: Colors.green,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.peach,
    fontFamily: 'Lexend_400Regular',
  },
  progressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.green,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.olive,
    fontFamily: 'Lexend_400Regular',
  },
});
