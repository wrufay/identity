import { Lexend_100Thin, Lexend_200ExtraLight, Lexend_300Light, Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Lexend_800ExtraBold, Lexend_900Black } from '@expo-google-fonts/lexend';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { ZCOOLKuaiLe_400Regular } from '@expo-google-fonts/zcool-kuaile';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlOverlay from '../../components/GlOverlay';
import TranslationOverlay from '../../components/TranslationOverlay';
import WelcomeOverlay from '../../components/WelcomeOverlay';
import { Colors } from '../../constants/theme';

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
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Compute 3D models based on detected content
  const models = useMemo(() => {
    if (!overlay) {
      return [];
    }

    const word = (overlay.english || overlay.translation || '').toLowerCase();

    // Dragon Boat / Zongzi
    if (word.includes('zong') || word.includes('粽') || word.includes('dragon boat') || word.includes('龙舟')) {
      return [
        {
          id: 'dragonboat',
          src: require('../../objects/dragon-boats.glb'),
          textures: [require('../../objects/dragon-boat.jpg')],
          position: { x: 0, y: -0.5, z: -2.5 },
          scale: 1.0
        },
      ];
    }

    // Lantern / Lion Dancer
    if (word.includes('lantern') || word.includes('灯笼') || word.includes('红灯笼') || word.includes('lion') || word.includes('red')) {
      return [
        {
          id: 'lion',
          src: require('../../objects/lion-dancer.glb'),
          textures: [require('../../objects/lion-dancer.jpg')],
          position: { x: 0, y: -0.5, z: -2.5 },
          scale: 1.2
        },
      ];
    }

    // Mooncake / Mid-Autumn
    if (word.includes('mooncake') || word.includes('月饼') || word.includes('mid') || word.includes('autumn')) {
      return [
        {
          id: 'midgirl',
          src: require('../../objects/midautumn-girl.glb'),
          textures: [require('../../objects/midautumn-girl.jpg')],
          position: { x: 0, y: -0.5, z: -2.5 },
          scale: 1.2
        },
      ];
    }

    return [];
  }, [overlay]);

  useEffect(() => {
    if (vrMode) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, [vrMode]);

  useEffect(() => {
    // Set audio mode to allow silent camera capture
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
  }, []);


  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false,
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
        // Show gentle error message
        setOverlay({
          translation: '',
          pronunciation: '',
          english: 'Nothing detected. Try again!',
          culturalContext: '',
        });
        setIsScanning(false);
        return;
      }

      setOverlay(data);
      setIsScanning(false);
    } catch (error) {
      console.error('Capture error:', error);
      setOverlay({
        translation: '',
        pronunciation: '',
        english: 'Nothing detected. Try again!',
        culturalContext: '',
      });
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
          {/* Left eye */}
          <View style={vrStyles.eyeHalf} />

          {/* Center divider */}
          <View style={vrStyles.centerDivider} />

          {/* Right eye */}
          <View style={vrStyles.eyeHalf} />
        </View>

        {/* Tap anywhere to scan */}
        <TouchableOpacity
          style={vrStyles.tapToScanArea}
          onPress={captureAndAnalyze}
          activeOpacity={1}
        >
          <View style={{ flex: 1 }} pointerEvents="box-none">
            {/* Exit VR button - bottom right */}
            <TouchableOpacity
              style={vrStyles.modeButton}
              onPress={() => {
                setVrMode(false);
                setOverlay(null);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/images/regular.png')}
                style={vrStyles.modeButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

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
        {/* VR Mode Toggle - bottom right */}
        <TouchableOpacity
          style={styles.modeButton}
          onPress={() => {
            setOverlay(null);
            setVrMode(true);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/images/vr.png')}
            style={styles.modeButtonImage}
            resizeMode="contain"
          />
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
                culturalContext={overlay.culturalContext}
                onDismiss={() => setOverlay(null)}
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
      <GlOverlay models={models} />
      <WelcomeOverlay
        hasSeenWelcome={hasSeenWelcome}
        onWelcomeDismissed={() => setHasSeenWelcome(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.olive,
  },
  camera: {
    flex: 1,
  },
  modeButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 50,
  },
  modeButtonImage: {
    width: 50,
    height: 50,
  },

  grantButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
  },
  grantButtonText: {
    color: Colors.red,
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
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  modeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 50,
  },
  modeButtonImage: {
    width: 50,
    height: 50,
  },

  tapToScanArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
