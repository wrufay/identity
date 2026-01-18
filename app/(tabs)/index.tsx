import { Lexend_100Thin, Lexend_200ExtraLight, Lexend_300Light, Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Lexend_800ExtraBold, Lexend_900Black } from '@expo-google-fonts/lexend';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { ZCOOLKuaiLe_400Regular } from '@expo-google-fonts/zcool-kuaile';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TranslationOverlay from '../../components/TranslationOverlay';

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
  const [fontsLoaded] = useFonts({
    ZCOOLKuaiLe_400Regular,
    NanumPenScript_400Regular,
    Lexend_100Thin,
    Lexend_200ExtraLight,
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
    Lexend_900Black,
  });

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [overlay, setOverlay] = useState<OverlayData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [vrMode, setVrMode] = useState(false);

  useEffect(() => {
    if (vrMode) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [vrMode]);


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
      setIsScanning(false);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to analyze image');
      setIsScanning(false);
    }
  };

  if (!fontsLoaded || !permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', marginBottom: 20 }}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.grantButton}>
          <Text style={styles.grantButtonText}>Grant</Text>
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
            {overlay ? (
              <TranslationOverlay
                translation={overlay.translation}
                pronunciation={overlay.pronunciation}
                english={overlay.english}
              />
            ) : isScanning ? (
              <TranslationOverlay
                translation=""
                pronunciation=""
                english=""
                isScanning={true}
              />
            ) : null}
          </View>

          {/* Center divider */}
          <View style={vrStyles.centerDivider} />

          {/* Right eye overlay */}
          <View style={vrStyles.eyeHalf}>
            {overlay ? (
              <TranslationOverlay
                translation={overlay.translation}
                pronunciation={overlay.pronunciation}
                english={overlay.english}
              />
            ) : isScanning ? (
              <TranslationOverlay
                translation=""
                pronunciation=""
                english=""
                isScanning={true}
              />
            ) : null}
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

        {/* Tap anywhere to scan or dismiss overlay */}
        {!overlay && !isScanning && (
          <TouchableOpacity
            style={vrStyles.tapToScanArea}
            onPress={captureAndAnalyze}
            activeOpacity={1}
          />
        )}

        {overlay && (
          <TouchableOpacity
            style={vrStyles.tapToScanArea}
            onPress={() => setOverlay(null)}
            activeOpacity={1}
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
          <Text style={styles.vrButtonText}>VR Mode</Text>
        </TouchableOpacity>

        {/* Tap anywhere to scan (only when no overlay is shown) */}
        {!overlay && !isScanning && (
          <TouchableOpacity
            style={styles.tapToScanArea}
            onPress={captureAndAnalyze}
            activeOpacity={1}
          />
        )}

        {/* Overlay */}
        {(overlay || isScanning) && (
          <TouchableOpacity
            style={styles.overlayContainer}
            onPress={() => setOverlay(null)}
            activeOpacity={1}
          >
            {overlay ? (
              <TranslationOverlay
                translation={overlay.translation}
                pronunciation={overlay.pronunciation}
                english={overlay.english}
              />
            ) : (
              <TranslationOverlay
                translation=""
                pronunciation=""
                english=""
                isScanning={true}
              />
            )}
          </TouchableOpacity>
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
    backgroundColor: 'rgba(254, 250, 220, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  vrButtonText: {
    color: '#333',
    fontFamily: 'NanumPenScript_400Regular',
    fontSize: 18,
  },
  grantButton: {
    backgroundColor: 'rgba(254, 250, 220, 0.5)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  grantButtonText: {
    color: '#FCD34D',
    fontFamily: 'ZCOOLKuaiLe_400Regular',
    fontSize: 18,
  },
  tapToScanArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  centerDivider: {
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  tapToScanArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
