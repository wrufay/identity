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
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vrButtonText: {
    color: 'black',
    fontWeight: 'bold',
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
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#00ff00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  englishWord: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  word: {
    fontSize: 48,
    color: '#00ff00',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pinyin: {
    fontSize: 20,
    color: '#aaa',
    marginBottom: 20,
  },
  audioButton: {
    backgroundColor: '#00ff00',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  audioText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioButtonDisabled: {
    opacity: 0.5,
  },
  culturalBox: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  culturalTitle: {
    color: '#00ff00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  culturalText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 22,
  },
  gotItButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  gotItText: {
    color: 'black',
    fontWeight: 'bold',
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
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  eyeContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  centerDivider: {
    width: 4,
    backgroundColor: '#000',
  },
  translation: {
    fontSize: 32,
    color: '#00ff00',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pinyin: {
    fontSize: 16,
    color: '#fff',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  english: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  exitButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  scanButtonInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#00ff00',
  },
  scanningText: {
    color: '#00ff00',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dismissArea: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 80,
  },
});
