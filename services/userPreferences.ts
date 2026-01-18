// User Preferences Service - Manages user learning profile and onboarding state

import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProficiencyLevel = 
  | 'absolute_beginner'
  | 'beginner' 
  | 'intermediate'
  | 'advanced'
  | 'fluent';

export type LearningGoal = 
  | 'travel'
  | 'culture_traditions'
  | 'business'
  | 'conversation'
  | 'reading_writing';

export type CommitmentLevel = 
  | '1_2_hours'    // 1-2 hours/week
  | '3_5_hours'    // 3-5 hours/week
  | '6_10_hours'   // 6-10 hours/week
  | '11_15_hours'  // 11-15 hours/week
  | '15_plus_hours'; // 15+ hours/week

export interface UserPreferences {
  hasCompletedOnboarding: boolean;
  userId: string;
  
  // Onboarding selections
  proficiencyLevel: ProficiencyLevel | null;
  learningGoal: LearningGoal | null;
  commitmentLevel: CommitmentLevel | null;
  
  // Performance tracking (for future adaptive updates)
  totalWordsLearned: number;
  currentStreak: number;
  lastActivityDate: string;
  
  createdAt: string;
  updatedAt: string;
}

const PREFERENCES_KEY = '@user_preferences';
const DEFAULT_USER_ID = 'default';

// Readable labels for UI
export const PROFICIENCY_LABELS: Record<ProficiencyLevel, { title: string; description: string; emoji: string }> = {
  absolute_beginner: {
    title: 'Absolute Beginner',
    description: 'I know zero Chinese',
    emoji: '🌱'
  },
  beginner: {
    title: 'Beginner',
    description: 'I know basic phrases',
    emoji: '🌿'
  },
  intermediate: {
    title: 'Intermediate',
    description: 'I can have conversations',
    emoji: '🌳'
  },
  advanced: {
    title: 'Advanced',
    description: 'I\'m fluent in most situations',
    emoji: '🎋'
  },
  fluent: {
    title: 'Fluent',
    description: 'I want to master nuances',
    emoji: '🏆'
  }
};

export const LEARNING_GOAL_LABELS: Record<LearningGoal, { title: string; description: string; emoji: string }> = {
  travel: {
    title: 'Travel',
    description: 'Navigate China with confidence',
    emoji: '✈️'
  },
  culture_traditions: {
    title: 'Culture & Traditions',
    description: 'Understand Chinese heritage',
    emoji: '🏮'
  },
  business: {
    title: 'Business',
    description: 'Professional communication',
    emoji: '💼'
  },
  conversation: {
    title: 'Conversation',
    description: 'Chat with friends & family',
    emoji: '💬'
  },
  reading_writing: {
    title: 'Reading & Writing',
    description: 'Master characters & literature',
    emoji: '📚'
  }
};

export const COMMITMENT_LABELS: Record<CommitmentLevel, { title: string; description: string; emoji: string }> = {
  '1_2_hours': {
    title: '1-2 Hours/Week',
    description: 'Casual learning pace',
    emoji: '🚶'
  },
  '3_5_hours': {
    title: '3-5 Hours/Week',
    description: 'Steady progress',
    emoji: '🏃'
  },
  '6_10_hours': {
    title: '6-10 Hours/Week',
    description: 'Dedicated learner',
    emoji: '🏃‍♂️'
  },
  '11_15_hours': {
    title: '11-15 Hours/Week',
    description: 'Intensive study',
    emoji: '🚀'
  },
  '15_plus_hours': {
    title: '15+ Hours/Week',
    description: 'Full immersion',
    emoji: '⚡'
  }
};

class UserPreferencesService {
  private preferences: UserPreferences | null = null;

  private getDefaultPreferences(): UserPreferences {
    return {
      hasCompletedOnboarding: false,
      userId: DEFAULT_USER_ID,
      proficiencyLevel: null,
      learningGoal: null,
      commitmentLevel: null,
      totalWordsLearned: 0,
      currentStreak: 0,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getPreferences(): Promise<UserPreferences> {
    if (this.preferences) return this.preferences;

    try {
      const data = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (data) {
        this.preferences = JSON.parse(data);
        console.log('✅ Loaded user preferences from storage');
        return this.preferences!;
      }
    } catch (error) {
      console.error('❌ Failed to load user preferences:', error);
    }

    // Return defaults if nothing saved
    const defaults = this.getDefaultPreferences();
    this.preferences = defaults;
    return defaults;
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();
    this.preferences = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
      console.log('💾 User preferences saved');
    } catch (error) {
      console.error('❌ Failed to save user preferences:', error);
    }
  }

  async completeOnboarding(
    proficiencyLevel: ProficiencyLevel,
    learningGoal: LearningGoal,
    commitmentLevel: CommitmentLevel
  ): Promise<void> {
    await this.updatePreferences({
      hasCompletedOnboarding: true,
      proficiencyLevel,
      learningGoal,
      commitmentLevel,
    });
    console.log('🎉 Onboarding completed!');
  }

  async hasCompletedOnboarding(): Promise<boolean> {
    const prefs = await this.getPreferences();
    return prefs.hasCompletedOnboarding;
  }

  async resetOnboarding(): Promise<void> {
    await this.updatePreferences({
      hasCompletedOnboarding: false,
      proficiencyLevel: null,
      learningGoal: null,
      commitmentLevel: null,
    });
    console.log('🔄 Onboarding reset');
  }

  async clearAll(): Promise<void> {
    this.preferences = null;
    await AsyncStorage.removeItem(PREFERENCES_KEY);
    console.log('🗑️  All preferences cleared');
  }
}

// Singleton instance
export const UserPrefs = new UserPreferencesService();
