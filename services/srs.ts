// Spaced Repetition System (SRS) Algorithm
// Uses SM-2 algorithm (SuperMemo 2) for optimal learning intervals

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analytics, AnalyticsEvents } from './analytics';

export interface SRSCard {
  id: string;
  userId: string;
  english: string;
  translation: string;
  pronunciation: string;
  culturalContext: string;
  
  // SRS specific fields
  easeFactor: number; // How easy the card is (default 2.5)
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  nextReview: string; // ISO timestamp
  lastReview: string; // ISO timestamp
  
  // Stats
  timesSeenCount: number;
  correctCount: number;
  incorrectCount: number;
  createdAt: string;
}

export enum ReviewQuality {
  AGAIN = 0,      // Complete blackout
  HARD = 1,       // Incorrect response but remembered
  GOOD = 2,       // Correct response with hesitation
  EASY = 3,       // Perfect response
}

const STORAGE_KEY = '@vocabulary_srs';

class SRSService {
  private cards: Map<string, SRSCard> = new Map();
  private loaded = false;

  // Load cards from AsyncStorage
  async loadCards(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const cardsArray: SRSCard[] = JSON.parse(data);
        this.cards = new Map(cardsArray.map(card => [card.id, card]));
        console.log(`✅ Loaded ${this.cards.size} SRS cards from storage`);
      }
      this.loaded = true;
    } catch (error) {
      console.error('❌ Failed to load SRS cards:', error);
      this.loaded = true;
    }
  }

  // Save cards to AsyncStorage
  async saveCards(): Promise<void> {
    try {
      const cardsArray = Array.from(this.cards.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cardsArray));
      console.log(`💾 Saved ${cardsArray.length} SRS cards to storage`);
    } catch (error) {
      console.error('❌ Failed to save SRS cards:', error);
    }
  }

  // Add or update a card
  async addCard(
    userId: string,
    english: string,
    translation: string,
    pronunciation: string,
    culturalContext: string
  ): Promise<SRSCard> {
    if (!this.loaded) await this.loadCards();

    // Check if card already exists
    const existingCard = Array.from(this.cards.values()).find(
      card => card.userId === userId && card.english.toLowerCase() === english.toLowerCase()
    );

    if (existingCard) {
      // Update times seen
      existingCard.timesSeenCount++;
      existingCard.lastReview = new Date().toISOString();
      await this.saveCards();

      Analytics.track(AnalyticsEvents.WORD_REVIEWED, userId, {
        word: translation,
        timesSeenCount: existingCard.timesSeenCount,
      });

      return existingCard;
    }

    // Create new card
    const card: SRSCard = {
      id: `${userId}_${Date.now()}`,
      userId,
      english,
      translation,
      pronunciation,
      culturalContext,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: new Date().toISOString(),
      lastReview: new Date().toISOString(),
      timesSeenCount: 1,
      correctCount: 0,
      incorrectCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.cards.set(card.id, card);
    await this.saveCards();

    Analytics.track(AnalyticsEvents.WORD_DISCOVERED, userId, {
      word: translation,
      english: english,
    });

    console.log(`🆕 New SRS card created: ${translation} (${english})`);
    return card;
  }

  // SM-2 Algorithm implementation
  private calculateNextReview(
    easeFactor: number,
    interval: number,
    repetitions: number,
    quality: ReviewQuality
  ): { easeFactor: number; interval: number; repetitions: number } {
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    let newRepetitions = repetitions;

    // Update ease factor
    newEaseFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
    );

    // If quality is too low, reset
    if (quality < ReviewQuality.GOOD) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions++;

      if (newRepetitions === 1) {
        newInterval = 1;
      } else if (newRepetitions === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }

    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
    };
  }

  // Review a card
  async reviewCard(cardId: string, quality: ReviewQuality): Promise<SRSCard> {
    if (!this.loaded) await this.loadCards();

    const card = this.cards.get(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    const { easeFactor, interval, repetitions } = this.calculateNextReview(
      card.easeFactor,
      card.interval,
      card.repetitions,
      quality
    );

    // Update card
    card.easeFactor = easeFactor;
    card.interval = interval;
    card.repetitions = repetitions;
    card.lastReview = new Date().toISOString();
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    card.nextReview = nextReviewDate.toISOString();

    // Update stats
    if (quality >= ReviewQuality.GOOD) {
      card.correctCount++;
    } else {
      card.incorrectCount++;
    }

    await this.saveCards();

    Analytics.track(AnalyticsEvents.SRS_CARD_ANSWERED, card.userId, {
      word: card.translation,
      quality: ReviewQuality[quality],
      nextInterval: interval,
      easeFactor: easeFactor.toFixed(2),
    });

    console.log(
      `📝 Card reviewed: ${card.translation} | Quality: ${ReviewQuality[quality]} | Next: ${interval} days`
    );

    return card;
  }

  // Get cards due for review
  async getDueCards(userId: string): Promise<SRSCard[]> {
    if (!this.loaded) await this.loadCards();

    const now = new Date();
    const dueCards = Array.from(this.cards.values()).filter(
      card => card.userId === userId && new Date(card.nextReview) <= now
    );

    if (dueCards.length > 0) {
      Analytics.track(AnalyticsEvents.SRS_CARD_DUE, userId, {
        count: dueCards.length,
      });
    }

    return dueCards.sort((a, b) => 
      new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
    );
  }

  // Get all cards for a user
  async getUserCards(userId: string): Promise<SRSCard[]> {
    if (!this.loaded) await this.loadCards();

    return Array.from(this.cards.values())
      .filter(card => card.userId === userId)
      .sort((a, b) => 
        new Date(b.lastReview).getTime() - new Date(a.lastReview).getTime()
      );
  }

  // Get statistics
  async getStats(userId: string) {
    if (!this.loaded) await this.loadCards();

    const userCards = await this.getUserCards(userId);
    const dueCards = await this.getDueCards(userId);

    return {
      totalCards: userCards.length,
      dueCards: dueCards.length,
      totalReviews: userCards.reduce((sum, card) => sum + card.correctCount + card.incorrectCount, 0),
      accuracy: userCards.length > 0
        ? (userCards.reduce((sum, card) => sum + card.correctCount, 0) /
          userCards.reduce((sum, card) => sum + card.correctCount + card.incorrectCount, 0)) * 100
        : 0,
    };
  }

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    this.cards.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('🗑️  All SRS data cleared');
  }
}

// Singleton instance
export const SRS = new SRSService();
