import { Colors } from '@/constants/theme';
import { Lexend_400Regular, Lexend_600SemiBold, useFonts as useLexendFonts } from '@expo-google-fonts/lexend';
import { NanumPenScript_400Regular, useFonts as useNanumFonts } from '@expo-google-fonts/nanum-pen-script';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  const [nanumLoaded] = useNanumFonts({
    NanumPenScript_400Regular,
  });

  const [lexendLoaded] = useLexendFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
  });

  const fontsLoaded = nanumLoaded && lexendLoaded;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/sunny.png')}
          style={styles.emoji}
        />
        <Text style={styles.title}>ᯓ★ ProjectOrigin</Text>
        <Text style={styles.description}>
        Welcome to your personal AR Chinese learning companion ₊⊹ Let's get to know you a bit more!
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(onboarding)/proficiency')}
        >
          <Text style={styles.startButtonText}>Get Started ☺︎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.peach,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.red,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Lexend_400Regular'
  },
  description: {
    fontSize: 22,
    color: Colors.olive,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'NanumPenScript_400Regular',
    marginBottom: 10
  },
  startButton: {
    backgroundColor: Colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
    shadowColor: Colors.red,
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.peach,
    fontFamily: 'Lexend_400Regular'
  },
});
