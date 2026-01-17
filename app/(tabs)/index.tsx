import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OverlayData {
  translation: string;
  pronunciation: string;
  culturalContext: string;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [overlay, setOverlay] = useState<OverlayData | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isScanning) return;

    setIsScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5
      });
      
      // TODO: Call your backend API here
      // For now, show fake data
      setTimeout(() => {
        setOverlay({
          translation: '饺子',
          pronunciation: 'jiǎozi',
          culturalContext: 'Made during Chinese New Year, each fold is a wish for prosperity. Shaped like ancient gold ingots to invite wealth. Your grandma probably folded these with her own grandmother.'
        });
        setIsScanning(false);
      }, 1500);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
      >
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

            <Text style={styles.word}>{overlay.translation}</Text>
            <Text style={styles.pinyin}>{overlay.pronunciation}</Text>
            
            <TouchableOpacity style={styles.audioButton}>
              <Text style={styles.audioText}>🔊 Hear pronunciation</Text>
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