// Test script for SRS and Analytics
// Run this to generate sample data and test the services

import { SRS, ReviewQuality } from './srs';
import { Analytics, AnalyticsEvents } from './analytics';

const sampleWords = [
  {
    english: 'dumpling',
    translation: '饺子',
    pronunciation: 'jiǎozi',
    culturalContext: 'Made during Chinese New Year, each fold is a wish for prosperity. Shaped like ancient gold ingots to invite wealth.',
  },
  {
    english: 'chopsticks',
    translation: '筷子',
    pronunciation: 'kuàizi',
    culturalContext: 'Used for over 3000 years. Hold them properly to show respect. Never stick them upright in rice - that\'s for funeral rites.',
  },
  {
    english: 'tea',
    translation: '茶',
    pronunciation: 'chá',
    culturalContext: 'Central to Chinese culture. Served to show respect and hospitality. The tea ceremony is an art form dating back thousands of years.',
  },
  {
    english: 'red envelope',
    translation: '红包',
    pronunciation: 'hóngbāo',
    culturalContext: 'Given during holidays and celebrations. Red symbolizes good luck and wards off evil spirits. Contains money for blessings.',
  },
  {
    english: 'dragon',
    translation: '龙',
    pronunciation: 'lóng',
    culturalContext: 'Symbol of power, strength, and good luck. Chinese emperors claimed to be descendants of dragons. Appears in festivals and celebrations.',
  },
];

export async function generateSampleData(userId: string = 'default') {
  console.log('🧪 Testing SRS System...\n');

  // Clear existing data
  await SRS.clearAll();
  Analytics.clearBuffer();

  // Track app open
  Analytics.track(AnalyticsEvents.APP_OPENED, userId);

  console.log('\n📝 Adding sample vocabulary...\n');

  const cards = [];

  // Add all sample words
  for (const word of sampleWords) {
    const card = await SRS.addCard(
      userId,
      word.english,
      word.translation,
      word.pronunciation,
      word.culturalContext
    );
    cards.push(card);
    
    // Simulate some review history
    if (Math.random() > 0.5) {
      console.log(`\n🔁 Simulating review for ${word.translation}...`);
      await SRS.reviewCard(card.id, ReviewQuality.GOOD);
    }
  }

  console.log('\n📊 Current Statistics:\n');
  const stats = await SRS.getStats(userId);
  console.log(JSON.stringify(stats, null, 2));

  console.log('\n📚 Due Cards:\n');
  const dueCards = await SRS.getDueCards(userId);
  console.log(`${dueCards.length} cards due for review`);
  dueCards.forEach(card => {
    console.log(`  - ${card.translation} (${card.english})`);
  });

  console.log('\n📈 All Cards:\n');
  const allCards = await SRS.getUserCards(userId);
  allCards.forEach(card => {
    console.log(`  ${card.translation} | Interval: ${card.interval} days | Seen: ${card.timesSeenCount}x`);
  });

  console.log('\n📊 Event Buffer:\n');
  const events = Analytics.getEventBuffer();
  console.log(`${events.length} total events tracked`);

  console.log('\n✅ Test complete! SRS system ready for AR UI testing.\n');
}

// Uncomment to run:
// generateSampleData().catch(console.error);
