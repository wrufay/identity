import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Backend API URL
const API_URL = 'https://identitybackend-production-ebf0.up.railway.app';

interface OverlayData {
  english: string;
  translation: string;
  pronunciation: string;
  culturalContext: string;
  isReview?: boolean;
  timesSeenCount?: number;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [overlay, setOverlay] = useState<OverlayData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [vrMode, setVrMode] = useState(false);

  useEffect(() => {
    if (vrMode) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [vrMode]);

  const playPronunciation = async (text: string) => {
    if (isPlayingAudio) return;

    setIsPlayingAudio(true);
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
          setIsPlayingAudio(false);
        }
      });
    } catch (error) {
      console.error('Audio error:', error);
      Alert.alert('Error', 'Failed to play pronunciation');
      setIsPlayingAudio(false);
    }
  };

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (!photo?.base64) {
        throw new Error('No image data');
      }

      // Send to backend API
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: photo.base64,
          userId: 'default',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Not Found', data.message || 'Item not recognized');
        setIsScanning(false);
        return;
      }

      setOverlay(data);

      // Auto-play pronunciation in VR mode
      if (vrMode) {
        playPronunciation(data.translation);
      }

      setIsScanning(false);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to analyze image');
      setIsScanning(false);
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', marginBottom: 20 }}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.scanButton}>
          <Text style={styles.scanButtonText}>Grant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // VR Mode render - split screen for Google Cardboard
  if (vrMode) {
    return (
      <View style={vrStyles.container}>
        {/* Single camera as background */}
        <CameraView
          style={vrStyles.fullCamera}
          facing="back"
          ref={cameraRef}
        />

        {/* Split overlay container */}
        <View style={vrStyles.splitOverlay}>
          {/* Left eye overlay */}
          <View style={vrStyles.eyeHalf}>
            {overlay && (
              <View style={vrStyles.eyeContent}>
                <Text style={vrStyles.translation}>{overlay.translation}</Text>
                <Text style={vrStyles.pinyin}>{overlay.pronunciation}</Text>
                <Text style={vrStyles.english}>{overlay.english}</Text>
              </View>
            )}
            {isScanning && (
              <Text style={vrStyles.scanningText}>...</Text>
            )}
          </View>

          {/* Center divider */}
          <View style={vrStyles.centerDivider} />

          {/* Right eye overlay */}
          <View style={vrStyles.eyeHalf}>
            {overlay && (
              <View style={vrStyles.eyeContent}>
                <Text style={vrStyles.translation}>{overlay.translation}</Text>
                <Text style={vrStyles.pinyin}>{overlay.pronunciation}</Text>
                <Text style={vrStyles.english}>{overlay.english}</Text>
              </View>
            )}
            {isScanning && (
              <Text style={vrStyles.scanningText}>...</Text>
            )}
          </View>
        </View>

        {/* Exit VR button (top left) */}
        <TouchableOpacity
          style={vrStyles.exitButton}
          onPress={() => {
            setVrMode(false);
            setOverlay(null);
          }}
        >
          <Text style={vrStyles.exitButtonText}>X</Text>
        </TouchableOpacity>

        {/* Scan button (bottom center) */}
        <TouchableOpacity
          style={vrStyles.scanButton}
          onPress={captureAndAnalyze}
          disabled={isScanning}
        >
          <View style={[vrStyles.scanButtonInner, isScanning && { opacity: 0.5 }]} />
        </TouchableOpacity>

        {/* Dismiss overlay (tap anywhere when overlay shown) */}
        {overlay && (
          <TouchableOpacity
            style={vrStyles.dismissArea}
            onPress={() => setOverlay(null)}
          />
        )}
      </View>
    );
  }

  // Normal mode render
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
      >
        {/* VR Mode Toggle */}
        <TouchableOpacity
          style={styles.vrButton}
          onPress={() => setVrMode(true)}
        >
          <Text style={styles.vrButtonText}>VR</Text>
        </TouchableOpacity>

        {/* Scan Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
            onPress={captureAndAnalyze}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? '...' : 'SCAN'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overlay */}
        {overlay && (
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setOverlay(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            {overlay.isReview && (
              <Text style={styles.reviewBadge}>
                Seen {overlay.timesSeenCount}x
              </Text>
            )}
            <Text style={styles.englishWord}>{overlay.english}</Text>
            <Text style={styles.word}>{overlay.translation}</Text>
            <Text style={styles.pinyin}>{overlay.pronunciation}</Text>

            <TouchableOpacity
              style={[styles.audioButton, isPlayingAudio && styles.audioButtonDisabled]}
              onPress={() => playPronunciation(overlay.translation)}
              disabled={isPlayingAudio}
            >
              <Text style={styles.audioText}>
                {isPlayingAudio ? '🔊 Playing...' : '🔊 Hear pronunciation'}
              </Text>
            </TouchableOpacity>

            <View style={styles.culturalBox}>
              <Text style={styles.culturalTitle}>Cultural Significance</Text>
              <Text style={styles.culturalText}>{overlay.culturalContext}</Text>
            </View>

            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setOverlay(null)}
            >
              <Text style={styles.gotItText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  vrButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vrButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 30,
    paddingTop: 40,
    maxHeight: '70%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  reviewBadge: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  englishWord: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  word: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 1,
  },
  pinyin: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  audioText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  audioButtonDisabled: {
    opacity: 0.5,
  },
  culturalBox: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  culturalTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  culturalText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 22,
  },
  gotItButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gotItText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

// VR Mode styles
const vrStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  splitOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  eyeHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  centerDivider: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  translation: {
    fontSize: 40,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  pinyin: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  english: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  exitButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  scanButton: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanningText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  dismissArea: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 80,
  },
});
