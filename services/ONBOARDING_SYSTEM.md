# User Preferences & Onboarding System

## Overview

The Identity app now features a comprehensive onboarding system that personalizes the learning experience based on user preferences. The Gemini API dynamically adjusts its responses based on these preferences.

## File Structure

```
services/
  └── userPreferences.ts        # User preferences service with AsyncStorage

app/
  ├── index.tsx                 # Root entry point - checks onboarding status
  ├── _layout.tsx               # Root layout
  └── (onboarding)/             # Onboarding flow
      ├── _layout.tsx           # Onboarding stack navigator
      ├── welcome.tsx           # Welcome screen
      ├── proficiency.tsx       # Proficiency level selection
      ├── goals.tsx             # Learning goals selection
      └── commitment.tsx        # Time commitment selection
```

## User Preferences

The system collects three key preferences during onboarding:

### 1. Proficiency Level
- **Absolute Beginner**: No Chinese knowledge
- **Beginner**: Knows basic phrases
- **Intermediate**: Can have conversations
- **Advanced**: Fluent in most situations
- **Fluent**: Mastering nuances

### 2. Learning Goals
- **Travel**: Navigate China with confidence
- **Culture & Traditions**: Understand Chinese heritage
- **Business**: Professional communication
- **Conversation**: Chat with friends & family
- **Reading & Writing**: Master characters & literature

### 3. Time Commitment
- **1-2 Hours/Week**: Casual learning pace
- **3-5 Hours/Week**: Steady progress
- **6-10 Hours/Week**: Dedicated learner
- **11-15 Hours/Week**: Intensive study
- **15+ Hours/Week**: Full immersion

## How Preferences Affect the Experience

### Gemini API Personalization

The Gemini API now receives context about the user's:
- **Proficiency level**: Adjusts vocabulary complexity and explanation depth
- **Learning goals**: Tailors examples and cultural context
- **Commitment level**: (Future) Affects content pacing

#### Response Structure

Enhanced responses now include:
```typescript
{
  item: string;           // English name
  chinese: string;        // Chinese characters
  pinyin: string;         // Pronunciation
  explanation: string;    // Level-appropriate explanation
  culturalContext: string; // Goal-appropriate context
  exampleSentence: string; // Usage example (Chinese)
  examplePinyin: string;   // Example pronunciation
  exampleEnglish: string;  // Example translation
}
```

## Usage

### Check if user has completed onboarding
```typescript
const hasCompleted = await UserPrefs.hasCompletedOnboarding();
```

### Get user preferences
```typescript
const prefs = await UserPrefs.getPreferences();
console.log(prefs.proficiencyLevel); // 'beginner'
console.log(prefs.learningGoal); // 'travel'
```

### Update preferences
```typescript
await UserPrefs.updatePreferences({
  proficiencyLevel: 'intermediate'
});
```

### Reset onboarding (for testing)
```typescript
await UserPrefs.resetOnboarding();
// Available in Explore tab UI
```

## Navigation Flow

1. **App Launch** → `app/index.tsx`
2. **Check onboarding status**
   - Not completed → Redirect to `(onboarding)/welcome`
   - Completed → Redirect to `(tabs)`
3. **Onboarding Flow**
   - Welcome → Proficiency → Goals → Commitment
   - On completion → Save preferences → Redirect to main app

## Testing

To test the onboarding flow:
1. Navigate to the **Explore** tab
2. Open **"Your Learning Profile"** section
3. Tap **"Reset Learning Profile"**
4. Confirm reset
5. You'll be redirected to onboarding

## Future Enhancements

- [ ] Adaptive difficulty based on performance
- [ ] Dynamic level adjustments (auto-upgrade/downgrade)
- [ ] Performance metrics tracking
- [ ] Spaced repetition integration with preferences
- [ ] Personalized review schedules based on commitment level
- [ ] Content filtering by learning goals

## Technical Details

### Storage
- Uses `@react-native-async-storage/async-storage`
- Key: `@user_preferences`
- Singleton pattern with in-memory cache

### Type Safety
- Full TypeScript support
- Exported types: `ProficiencyLevel`, `LearningGoal`, `CommitmentLevel`
- Interface: `UserPreferences`

### Analytics Integration
- Ready for analytics tracking
- Events: onboarding_completed, preference_updated, etc.
