import { Asset } from 'expo-asset';
import { GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import React, { useEffect, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

// Import GLTFLoader using the correct path for newer three.js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface Model {
  id: string;
  src: any; // Main file: .glb or .gltf
  bin?: any; // Optional .bin file for GLTF
  textures?: any[]; // Optional texture files for GLTF
  position: { x: number; y: number; z: number };
  scale: number;
}

interface GlOverlayProps {
  models: Model[];
}

// Cache for loaded data URLs to avoid reloading large files
const dataUrlCache = new Map<string, string>();
const gltfCache = new Map<string, any>();

export default function GlOverlay({ models }: GlOverlayProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const loadedModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const isLoadingRef = useRef<boolean>(false);
  const previousModelsRef = useRef<string>('');
  const rotationRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, z: 0 });
  const glRef = useRef<any>(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const isTwoFingerRef = useRef(false);

  // Boundaries to keep models on screen
  const BOUNDS = {
    minX: -1.5,
    maxX: 1.5,
    minZ: -2,   // Closest (pulled toward you)
    maxZ: 3,    // Furthest (pushed away)
  };

  // Create pan responder for touch controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Check if two fingers
        isTwoFingerRef.current = evt.nativeEvent.touches.length >= 2;
        lastTouchRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (evt, gestureState) => {
        const isTwoFinger = evt.nativeEvent.touches.length >= 2;
        
        if (isTwoFinger || isTwoFingerRef.current) {
          // Two finger drag = move on table plane
          isTwoFingerRef.current = true;
          const moveSensitivity = 0.001; // Very low sensitivity
          
          // Calculate new position
          let newX = positionRef.current.x + gestureState.dx * moveSensitivity;
          let newZ = positionRef.current.z + gestureState.dy * moveSensitivity;
          
          // Clamp to bounds to keep on screen
          newX = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, newX));
          newZ = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, newZ));
          
          positionRef.current.x = newX;
          positionRef.current.z = newZ;
          
          // Apply position to all models
          loadedModelsRef.current.forEach((model: THREE.Group) => {
            model.position.x = positionRef.current.x;
            // Moving up on screen = pushing away (more negative z)
            model.position.z = -2.5 + positionRef.current.z;
            // Slight y adjustment to simulate slanted table (further = slightly lower)
            model.position.y = -0.5 - (positionRef.current.z * 0.15);
          });
        } else {
          // One finger = rotate
          const sensitivity = 0.003;
          rotationRef.current.y += gestureState.dx * sensitivity;
          
          loadedModelsRef.current.forEach((model: THREE.Group) => {
            model.rotation.y = rotationRef.current.y;
          });
        }
      },
      onPanResponderRelease: () => {
        isTwoFingerRef.current = false;
      },
    })
  ).current;

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      loadedModelsRef.current.forEach(model => {
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => mat.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      });
      loadedModelsRef.current.clear();
    };
  }, []);

  const onContextCreate = async (gl: any) => {
    try {
      console.log('🎨 GL Context created, initializing...');
      
      // Use expo-three Renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      console.log('✅ Renderer initialized');

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      // Position camera slightly above and looking down for AR table effect
      camera.position.set(0, 1, 0);
      camera.rotation.x = -0.3; // Tilt down slightly
      cameraRef.current = camera;

      console.log('✅ Scene and camera initialized');

      // Brighter lights for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);

      const pointLight1 = new THREE.PointLight(0xffffff, 1.0);
      pointLight1.position.set(2, 3, 2);
      scene.add(pointLight1);

      console.log('✅ Lights added');

      await loadModels(scene, models);
      
      console.log(`🎬 About to start animation with ${loadedModelsRef.current.size} models in scene`);

      glRef.current = gl;
      
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // No auto-rotation - user controls rotation via touch

        try {
          renderer.render(scene, camera);
          gl.endFrameEXP();
        } catch (renderError) {
          // Silently catch render errors - don't log to keep demo clean
        }
      };

      animate();
      console.log('✅ Animation loop started');
    } catch (error) {
      console.error('❌ GL Context error:', error);
    }
  };

  const loadModels = async (scene: THREE.Scene, modelList: Model[]) => {
    // Prevent duplicate loading
    if (isLoadingRef.current) {
      console.log('⚠️ Already loading models, skipping...');
      return;
    }
    
    isLoadingRef.current = true;
    console.log(`📦 Loading ${modelList.length} 3D models...`);

    // Remove models no longer in list
    const currentIds = new Set(modelList.map(m => m.id));
    loadedModelsRef.current.forEach((model: THREE.Group, id: string) => {
      if (!currentIds.has(id)) {
        console.log(`Removing model: ${id}`);
        scene.remove(model);
        loadedModelsRef.current.delete(id);
      }
    });

    // Load new models
    for (const modelData of modelList) {
      if (loadedModelsRef.current.has(modelData.id)) {
        console.log(`Model ${modelData.id} already loaded`);
        continue;
      }

      try {
        console.log(`Loading model: ${modelData.id}...`);
        
        // Download main file (.glb or .gltf) - this is fast, already cached after first load
        const mainAsset = Asset.fromModule(modelData.src);
        await mainAsset.downloadAsync();
        
        if (!mainAsset.localUri) {
          console.error(`❌ Failed to download main asset for ${modelData.id}`);
          continue;
        }

        console.log(`Main file: ${mainAsset.localUri}`);

        // Check if it's a GLTF with external files
        const isGltf = mainAsset.localUri.endsWith('.gltf');
        
        if (isGltf && modelData.bin) {
          // Load GLTF with external .bin and textures
          console.log(`Loading GLTF with external files...`);
          
          // Download .bin file
          const binAsset = Asset.fromModule(modelData.bin);
          await binAsset.downloadAsync();
          console.log(`Binary file: ${binAsset.localUri}`);

          // Download textures if any
          const textureUris: string[] = [];
          if (modelData.textures) {
            for (const textureSrc of modelData.textures) {
              const textureAsset = Asset.fromModule(textureSrc);
              await textureAsset.downloadAsync();
              if (textureAsset.localUri) {
                textureUris.push(textureAsset.localUri);
                console.log(`Texture: ${textureAsset.localUri}`);
              }
            }
          }

          // Fetch GLTF JSON
          const gltfResponse = await fetch(mainAsset.localUri);
          const gltfJson = await gltfResponse.json();
          
          // Fetch binary buffer
          const binResponse = await fetch(binAsset.localUri!);
          const binBuffer = await binResponse.arrayBuffer();
          
          console.log(`GLTF JSON and binary loaded, parsing...`);

          // For GLTF with external bin, convert to GLB format in memory
          // GLB format: header (12 bytes) + JSON chunk + BIN chunk
          
          // Remove the bin URI from JSON since we're embedding it
          if (gltfJson.buffers && gltfJson.buffers[0]) {
            delete gltfJson.buffers[0].uri;
            console.log(`✅ Removed bin URI, preparing GLB format`);
          }
          
          const jsonString = JSON.stringify(gltfJson);
          const jsonBuffer = new TextEncoder().encode(jsonString);
          
          // Pad JSON to 4-byte boundary
          const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
          const jsonLength = jsonBuffer.length + jsonPadding;
          
          // Pad binary to 4-byte boundary
          const binPadding = (4 - (binBuffer.byteLength % 4)) % 4;
          const binLength = binBuffer.byteLength + binPadding;
          
          // Calculate total GLB size
          const totalLength = 12 + 8 + jsonLength + 8 + binLength;
          
          // Create GLB buffer
          const glbBuffer = new ArrayBuffer(totalLength);
          const glbView = new DataView(glbBuffer);
          const glbBytes = new Uint8Array(glbBuffer);
          
          let offset = 0;
          
          // GLB Header (12 bytes)
          glbView.setUint32(offset, 0x46546C67, true); // 'glTF' magic
          offset += 4;
          glbView.setUint32(offset, 2, true); // version 2
          offset += 4;
          glbView.setUint32(offset, totalLength, true); // total length
          offset += 4;
          
          // JSON Chunk Header (8 bytes)
          glbView.setUint32(offset, jsonLength, true); // chunk length
          offset += 4;
          glbView.setUint32(offset, 0x4E4F534A, true); // 'JSON' chunk type
          offset += 4;
          
          // JSON Chunk Data
          glbBytes.set(jsonBuffer, offset);
          offset += jsonBuffer.length;
          // Pad with spaces
          for (let i = 0; i < jsonPadding; i++) {
            glbBytes[offset++] = 0x20;
          }
          
          // BIN Chunk Header (8 bytes)
          glbView.setUint32(offset, binLength, true); // chunk length
          offset += 4;
          glbView.setUint32(offset, 0x004E4942, true); // 'BIN\0' chunk type
          offset += 4;
          
          // BIN Chunk Data
          glbBytes.set(new Uint8Array(binBuffer), offset);
          offset += binBuffer.byteLength;
          // Pad with zeros
          for (let i = 0; i < binPadding; i++) {
            glbBytes[offset++] = 0x00;
          }
          
          console.log(`✅ GLB buffer created (${totalLength} bytes)`);
          
          // Convert ArrayBuffer to Uint8Array (React Native Blob supports Uint8Array)
          const glbBytes2 = new Uint8Array(glbBuffer);
          
          // Create blob from Uint8Array
          const glbBlob = new Blob([glbBytes2], { type: 'model/gltf-binary' });
          
          console.log(`✅ GLB blob created, converting to data URL...`);
          
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(glbBlob);
          });

          console.log(`✅ GLB data URL created, loading with GLTFLoader...`);

          const loader = new GLTFLoader();
          
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(
              dataUrl,
              (gltf: any) => {
                console.log(`✅ GLTF loaded for ${modelData.id}`);
                resolve(gltf);
              },
              undefined,
              (error: any) => {
                console.error(`❌ GLTF load error for ${modelData.id}:`, error);
                reject(error);
              }
            );
          });

          const model = gltf.scene;
          
          // Load and apply textures manually using expo-three TextureLoader
          if (modelData.textures && modelData.textures.length > 0) {
            console.log(`🎨 Loading ${modelData.textures.length} textures for ${modelData.id}...`);
            try {
              const textureLoader = new TextureLoader();
              const textureAsset = Asset.fromModule(modelData.textures[0]);
              await textureAsset.downloadAsync();
              
              if (textureAsset.localUri) {
                console.log(`📸 Loading texture from: ${textureAsset.localUri}`);
                const texture = await textureLoader.loadAsync(textureAsset.localUri);
                texture.flipY = false; // GLTF uses flipped UVs
                
                // Apply texture to all meshes in the model - CREATE NEW MATERIALS
                model.traverse((child: any) => {
                  if (child.isMesh && child.geometry) {
                    console.log(`✅ Creating textured material for mesh: ${child.name}`);
                    // Create a new MeshStandardMaterial with the texture
                    const newMaterial = new THREE.MeshStandardMaterial({
                      map: texture,
                      metalness: 0,
                      roughness: 0.5,
                    });
                    child.material = newMaterial;
                  }
                });
                console.log(`✅ Textures applied to ${modelData.id}`);
              }
            } catch (texError) {
              console.error(`⚠️ Texture loading failed for ${modelData.id}, using untextured model:`, texError);
            }
          }
          
          model.position.set(
            modelData.position.x,
            modelData.position.y,
            modelData.position.z
          );
          model.scale.set(modelData.scale, modelData.scale, modelData.scale);

          scene.add(model);
          loadedModelsRef.current.set(modelData.id, model);

          console.log(`✅ Model ${modelData.id} added to scene`);
        } else {
          // Load as GLB (single file) - optimized with caching
          const cacheKey = mainAsset.localUri;
          
          let dataUrl = dataUrlCache.get(cacheKey);
          if (!dataUrl) {
            // Only fetch and convert if not cached
            const response = await fetch(mainAsset.localUri);
            const blob = await response.blob();

            // Convert blob to data URL
            dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            
            // Cache for next time
            dataUrlCache.set(cacheKey, dataUrl);
          } else {
            console.log(`📦 Using cached data for ${modelData.id}`);
          }

          const loader = new GLTFLoader();
          
          // Temporarily suppress console.error to hide texture loading errors
          const originalError = console.error;
          console.error = (...args: any[]) => {
            const msg = args[0]?.toString() || '';
            // Only suppress THREE.GLTFLoader texture errors
            if (!msg.includes('THREE.GLTFLoader') && !msg.includes('Couldn\'t load texture')) {
              originalError(...args);
            }
          };
          
          const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(
              dataUrl,
              (gltf: any) => {
                console.log(`✅ GLB loaded for ${modelData.id}`);
                resolve(gltf);
              },
              undefined,
              (error: any) => {
                console.error(`❌ GLB load error for ${modelData.id}:`, error);
                reject(error);
              }
            );
          });
          
          // Restore original console.error
          console.error = originalError;

          const model = gltf.scene;
          
          // CRITICAL: Replace ALL materials with simple ones that work in React Native
          // The materials from GLB have broken textures that cause render errors
          console.log(`🔧 Replacing materials for ${modelData.id}...`);
          model.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
              // Create a simple gray material that will always work
              // Use MeshBasicMaterial which doesn't require complex shaders
              const simpleMaterial = new THREE.MeshBasicMaterial({
                color: 0x999999, // Gray color
              });
              child.material = simpleMaterial;
            }
          });
          console.log(`✅ Materials replaced for ${modelData.id}`);
          
          // Load and apply textures manually using expo-three TextureLoader
          if (modelData.textures && modelData.textures.length > 0) {
            console.log(`🎨 Loading texture for ${modelData.id}...`);
            try {
              const textureLoader = new TextureLoader();
              const textureAsset = Asset.fromModule(modelData.textures[0]);
              await textureAsset.downloadAsync();
              
              if (textureAsset.localUri) {
                const texture = await textureLoader.loadAsync(textureAsset.localUri);
                texture.flipY = false; // GLB models expect flipY = false
                texture.needsUpdate = true;
                
                // Apply texture to all meshes using MeshBasicMaterial (simpler, no shader issues)
                model.traverse((child: any) => {
                  if (child.isMesh && child.geometry) {
                    const texturedMaterial = new THREE.MeshBasicMaterial({
                      map: texture,
                    });
                    child.material = texturedMaterial;
                  }
                });
                console.log(`✅ Texture applied to ${modelData.id}`);
              }
            } catch (texError) {
              console.log(`⚠️ Texture loading failed, using gray material`);
            }
          }
          
          model.position.set(
            modelData.position.x,
            modelData.position.y,
            modelData.position.z
          );
          model.scale.set(modelData.scale, modelData.scale, modelData.scale);

          scene.add(model);
          loadedModelsRef.current.set(modelData.id, model);

          console.log(`✅ Model ${modelData.id} added to scene`);
        }
      } catch (error) {
        console.error(`❌ Error loading model ${modelData.id}:`, error);
      }
    }
    
    console.log(`✅ Finished. Total models in scene: ${loadedModelsRef.current.size}`);
    isLoadingRef.current = false;
  };

  useEffect(() => {
    // Create a unique key from models to detect real changes
    const modelsKey = JSON.stringify(models.map(m => ({ id: m.id, src: m.src })));
    
    if (sceneRef.current && models.length > 0 && modelsKey !== previousModelsRef.current) {
      console.log('Models changed, reloading...');
      previousModelsRef.current = modelsKey;
      loadModels(sceneRef.current, models);
    }
  }, [models]);

  if (models.length === 0) {
    console.log('No models to display');
    return null;
  }

  console.log(`Rendering GlOverlay with ${models.length} models`);
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
      {/* Touch area only covers bottom portion where 3D model appears */}
      <View style={styles.touchArea} {...panResponder.panHandlers} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  touchArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%', // Only bottom half responds to touch for model interaction
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent',
    pointerEvents: 'none', // GL view doesn't capture touches
  },
});
