import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { UserPrefs } from '@/services/userPreferences';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const completed = await UserPrefs.hasCompletedOnboarding();
        setHasCompleted(completed);
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setIsChecking(false);
      }
    }

    checkOnboarding();
  }, []);

  if (isChecking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FCD34D" />
      </View>
    );
  }

  // Redirect based on onboarding status
  if (hasCompleted) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/welcome" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
