import { Colors } from '@/constants/theme';
import { LEARNING_GOAL_LABELS, LearningGoal, UserPrefs } from '@/services/userPreferences';
import { Lexend_400Regular, Lexend_600SemiBold, useFonts as useLexendFonts } from '@expo-google-fonts/lexend';
import { NanumPenScript_400Regular, useFonts as useNanumFonts } from '@expo-google-fonts/nanum-pen-script';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GoalsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<LearningGoal | null>(null);

  const [nanumLoaded] = useNanumFonts({
    NanumPenScript_400Regular,
  });

  const [lexendLoaded] = useLexendFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
  });

  const fontsLoaded = nanumLoaded && lexendLoaded;

  const goalOptions: LearningGoal[] = [
    'travel',
    'culture_traditions',
    'business',
    'conversation',
    'reading_writing',
  ];

  const goalImages = {
    travel: require('@/assets/images/travel.png'),
    culture_traditions: require('@/assets/images/culture.png'),
    business: require('@/assets/images/business.png'),
    conversation: require('@/assets/images/conversation.png'),
    reading_writing: require('@/assets/images/reading.png'),
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleContinue = async () => {
    if (!selected) return;
    
    await UserPrefs.updatePreferences({ learningGoal: selected });
    router.push('/(onboarding)/commitment');
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
        <Text style={styles.title}>What's your main goal?</Text>
        <Text style={styles.subtitle}>
          We'll prioritize content that matches your learning objective
        </Text>

        <View style={styles.options}>
          {goalOptions.map((goal) => {
            const label = LEARNING_GOAL_LABELS[goal];
            return (
              <TouchableOpacity
                key={goal}
                style={[styles.option, selected === goal && styles.selectedOption]}
                onPress={() => setSelected(goal)}
              >
                <Image
                  source={goalImages[goal]}
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
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.continueButton, !selected && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!selected}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>2 of 3</Text>
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
  continueButton: {
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
  continueButtonText: {
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
