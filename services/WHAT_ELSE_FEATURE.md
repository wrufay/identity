# "What else?" Feature - Additional Context Generation

## Overview

The "What else?" feature provides learners with additional personalized context about scanned items. When users scan an object and see its translation, they can tap the "What else? 💡" button to generate a contextual sentence that helps reinforce their learning.

## Architecture

### Files Created/Modified

1. **`services/backboardService.ts`** - Added `generateAdditionalContext()` function
2. **`components/AdditionalContextModal.tsx`** - New modal component for displaying additional content
3. **`components/TranslationOverlay.tsx`** - Added "What else?" button and modal integration

## User Flow

```
1. User scans an object (e.g., "Book" / "书")
2. Translation overlay appears with word information
3. User taps "What else? 💡" button
4. Modal opens and generates personalized sentence
5. Sentence is displayed with:
   - Chinese characters
   - Pinyin pronunciation
   - English translation
   - Explanation of why it's useful
   - Difficulty indicator (Easy/Medium/Hard)
6. Audio pronunciation plays automatically
7. User can replay audio or close modal
```

## API Function: `generateAdditionalContext()`

### Parameters
- `itemEnglish` (string): English name of the scanned item
- `itemChinese` (string): Chinese translation of the item

### Returns
```typescript
{
  sentence: string;      // Chinese sentence using the word
  pinyin: string;        // Full pinyin with tone marks
  english: string;       // English translation
  explanation: string;   // Why this sentence is useful
  difficulty: string;    // 'easy' | 'medium' | 'hard'
}
```

### Example Response

**For a beginner learning "书" (book) for travel:**
```json
{
  "sentence": "我想买一本书",
  "pinyin": "wǒ xiǎng mǎi yī běn shū",
  "english": "I want to buy a book",
  "explanation": "Useful phrase for shopping in bookstores during travel",
  "difficulty": "easy"
}
```

**For an advanced learner studying "书" for culture:**
```json
{
  "sentence": "这本古书记载了唐朝的历史",
  "pinyin": "zhè běn gǔ shū jì zǎi le táng cháo de lì shǐ",
  "english": "This ancient book records the history of the Tang Dynasty",
  "explanation": "Introduces cultural context about Chinese historical documentation",
  "difficulty": "hard"
}
```

## Personalization Based on User Preferences

### By Proficiency Level

**Absolute Beginner:**
- Simplest vocabulary
- Common everyday phrases
- Focus on practical usage
- Difficulty: mostly "easy"

**Beginner:**
- Basic conversational phrases
- Simple grammar structures
- Everyday contexts
- Difficulty: easy to medium

**Intermediate:**
- Natural conversational language
- Idiomatic expressions
- More complex contexts
- Difficulty: medium

**Advanced:**
- Sophisticated vocabulary
- Literary expressions
- Nuanced meanings
- Difficulty: medium to hard

**Fluent:**
- Native-level expressions
- Classical references
- Regional variations
- Difficulty: hard

### By Learning Goals

**Travel:**
- Phrases for navigation, shopping, ordering food
- Hotel and transportation vocabulary
- Emergency phrases

**Culture & Traditions:**
- Historical context
- Festival and tradition references
- Cultural practices and customs

**Business:**
- Professional terminology
- Formal language structures
- Business etiquette phrases

**Conversation:**
- Casual everyday expressions
- Social interaction phrases
- Colloquial language

**Reading & Writing:**
- Character usage in context
- Written vs. spoken differences
- Literary examples

## Component Features

### AdditionalContextModal

**Features:**
- 📱 Full-screen modal with elegant dark design
- 🎨 Difficulty badges (Easy 🌱, Medium 🌿, Hard 🌳)
- 🔊 Auto-play pronunciation on load
- 🔄 Replay audio button
- 💡 Contextual explanations
- ⚡ Loading states and error handling
- ✕ Easy close/dismiss

**UI Elements:**
- Header with title and close button
- Difficulty indicator with color coding
- Large Chinese sentence (tappable for audio)
- Pinyin pronunciation
- English translation
- Explanation box with "Why this matters"
- Replay audio button
- Done button

### TranslationOverlay Updates

**Added:**
- "What else? 💡" button below main content
- Modal state management
- Integration with AdditionalContextModal

**Styling:**
- Semi-transparent yellow background
- Yellow border matching app theme
- Positioned below English translation
- Visible but not intrusive

## Technical Details

### API Integration
- Uses Gemini 1.5 Flash model via Backboard.io
- Temperature: 0.7 (more creative for varied sentences)
- Max tokens: 400
- Personalized prompt based on user preferences

### Audio Playback
- Automatic pronunciation on content load
- Uses existing TTS endpoint
- Unloads audio after playback
- Graceful error handling

### State Management
- Modal visibility controlled in TranslationOverlay
- Loading state during API call
- Error state with retry option
- Content state with generated sentence

### Error Handling
- Network errors caught and displayed
- Retry button for failed requests
- Fallback messaging for users
- Console logging for debugging

## Usage Example

```typescript
// The TranslationOverlay component now includes the button
<TranslationOverlay
  translation="书"
  pronunciation="shū"
  english="book"
/>

// Button appears automatically
// Modal opens when user taps "What else? 💡"
// Generates content based on user's:
// - proficiencyLevel: 'intermediate'
// - learningGoal: 'travel'
// - commitmentLevel: '6_10_hours'
```

## Benefits

### For Learners
- **Contextual learning**: See words used in real sentences
- **Personalized difficulty**: Content matches their level
- **Goal-aligned**: Examples relate to their learning objectives
- **Audio reinforcement**: Hear proper pronunciation
- **Cultural insight**: Understand why sentences matter

### For Retention
- **Active engagement**: User initiates additional learning
- **Spaced exposure**: Reinforces vocabulary immediately
- **Multiple modalities**: Visual + audio + contextual
- **Meaningful context**: Sentences have practical applications

## Future Enhancements

- [ ] Generate multiple sentence options
- [ ] Save favorite sentences to SRS
- [ ] Track which additional contexts were viewed
- [ ] Suggest related vocabulary from sentence
- [ ] Add grammar breakdown for sentences
- [ ] Include regional variations
- [ ] Show usage frequency statistics

## Testing

To test the feature:
1. Launch the app and complete onboarding
2. Scan any object with the camera
3. Wait for translation overlay
4. Tap "What else? 💡" button
5. Observe personalized sentence generation
6. Listen to pronunciation
7. Try with different proficiency levels (reset onboarding to test)

The sentences should adapt based on your selected:
- Proficiency level (complexity)
- Learning goal (context type)
- Both combined for optimal personalization
