import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/theme';

const API_URL = 'https://identitybackend-production-ebf0.up.railway.app';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SIZE = 20; // Size of each grid cell

// Graph paper grid background component
const GraphPaperBackground = () => {
  const numCols = Math.ceil(SCREEN_WIDTH / GRID_SIZE);
  const numRows = Math.ceil(SCREEN_HEIGHT / GRID_SIZE);

  return (
    <View style={graphStyles.gridContainer} pointerEvents="none">
      {/* Vertical lines */}
      {Array.from({ length: numCols + 1 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            graphStyles.verticalLine,
            { left: i * GRID_SIZE },
          ]}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: numRows + 1 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[
            graphStyles.horizontalLine,
            { top: i * GRID_SIZE },
          ]}
        />
      ))}
    </View>
  );
};

const graphStyles = StyleSheet.create({
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(173, 216, 230, 0.3)', // Light blue grid lines
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(173, 216, 230, 0.3)', // Light blue grid lines
  },
});

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface SunnyChatProps {
  onClose: () => void;
}

export default function SunnyChat({ onClose }: SunnyChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Sunny, your cultural learning assistant. Ask me anything about Chinese language, culture, or the objects you've scanned!",
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send to backend API with conversation history (excluding the welcome message)
      const conversationHistory = updatedMessages.slice(1); // Skip the initial greeting

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          userId: 'default',
          conversationHistory: conversationHistory.slice(-10), // Send last 10 messages for context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't connect right now. Please try again!",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Graph paper background */}
      <GraphPaperBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <Image
            source={require('../assets/images/sunny.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.headerTitle}>Chat with Sunny AI</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userText : styles.aiText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator color={Colors.orange} size="small" />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Sunny anything..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#f5f5f0', // Off-white graph paper color
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(245, 245, 240, 0.95)',
    borderBottomColor: 'rgba(173, 216, 230, 0.5)',
  },
  headerLogoContainer: {
    borderRadius: 24,
    padding: 4,
    marginRight: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    color: Colors.olive,
    fontFamily: 'NanumPenScript_400Regular',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 106, 10, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.olive,
    fontSize: 18,
    fontWeight: '300',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.olive,
    fontFamily: 'Lexend_400Regular',
  },
  aiText: {
    color: Colors.olive,
    fontFamily: 'Lexend_400Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: 'rgba(173, 216, 230, 0.5)',
    backgroundColor: 'rgba(245, 245, 240, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.olive,
    fontFamily: 'Lexend_400Regular',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sendButtonText: {
    color: Colors.olive,
    fontSize: 20,
    fontWeight: '600',
  },
});
