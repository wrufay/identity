/**
 * Test file for Backboard.io API integration
 * This helps verify the API connection and response parsing
 */

import { analyzeImageWithGemini, isValidVisionResponse } from './backboardService';

/**
 * Test with a sample base64 image
 * Replace this with an actual base64 image string to test
 */
async function testBackboardAPI() {
  console.log('Testing Backboard.io API...');
  
  // Sample base64 image (1x1 red pixel - replace with real image for actual testing)
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  try {
    const result = await analyzeImageWithGemini(sampleBase64);
    
    console.log('API Response:', result);
    
    if (isValidVisionResponse(result)) {
      console.log('✅ Valid response received:');
      console.log(`   Item: ${result.item}`);
      console.log(`   Chinese: ${result.chinese}`);
      console.log(`   Pinyin: ${result.pinyin}`);
    } else {
      console.log('⚠️ No valid response (empty or null)');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('\nTesting error handling...');
  
  try {
    // Test with invalid base64
    const result = await analyzeImageWithGemini('invalid-base64');
    console.log('Error handling result:', result);
  } catch (error) {
    console.log('✅ Error caught successfully:', error);
  }
}

// Export test functions
export { testBackboardAPI, testErrorHandling };

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await testBackboardAPI();
    await testErrorHandling();
  })();
}
