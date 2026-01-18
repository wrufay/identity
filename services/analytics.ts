// Mock Analytics Service for Snowflake & Amplitude
// Logs all behavioral events to console for development

export interface BehaviorEvent {
  eventName: string;
  userId: string;
  timestamp: string;
  properties?: Record<string, any>;
}

class MockAnalyticsService {
  private eventBuffer: BehaviorEvent[] = [];
  
  // Mock Snowflake tracking
  trackSnowflake(eventName: string, userId: string, properties?: Record<string, any>) {
    const event: BehaviorEvent = {
      eventName: `[SNOWFLAKE] ${eventName}`,
      userId,
      timestamp: new Date().toISOString(),
      properties,
    };
    
    this.eventBuffer.push(event);
    console.log('🔵 SNOWFLAKE EVENT:', JSON.stringify(event, null, 2));
    
    return event;
  }
  
  // Mock Amplitude tracking
  trackAmplitude(eventName: string, userId: string, properties?: Record<string, any>) {
    const event: BehaviorEvent = {
      eventName: `[AMPLITUDE] ${eventName}`,
      userId,
      timestamp: new Date().toISOString(),
      properties,
    };
    
    this.eventBuffer.push(event);
    console.log('🟣 AMPLITUDE EVENT:', JSON.stringify(event, null, 2));
    
    return event;
  }
  
  // Combined tracking (sends to both)
  track(eventName: string, userId: string, properties?: Record<string, any>) {
    console.log('📊 BEHAVIORAL EVENT FIRED:', eventName);
    this.trackSnowflake(eventName, userId, properties);
    this.trackAmplitude(eventName, userId, properties);
  }
  
  // Get event history
  getEventBuffer() {
    return this.eventBuffer;
  }
  
  // Clear buffer
  clearBuffer() {
    this.eventBuffer = [];
    console.log('🗑️  Event buffer cleared');
  }
}

// Singleton instance
export const Analytics = new MockAnalyticsService();

// Predefined event types
export const AnalyticsEvents = {
  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_CLOSED: 'app_closed',
  VR_MODE_ENABLED: 'vr_mode_enabled',
  VR_MODE_DISABLED: 'vr_mode_disabled',
  
  // Camera & Scanning
  SCAN_INITIATED: 'scan_initiated',
  SCAN_SUCCESS: 'scan_success',
  SCAN_FAILED: 'scan_failed',
  
  // Learning events
  WORD_DISCOVERED: 'word_discovered',
  WORD_REVIEWED: 'word_reviewed',
  AUDIO_PLAYED: 'audio_played',
  
  // User interactions
  OVERLAY_OPENED: 'overlay_opened',
  OVERLAY_CLOSED: 'overlay_closed',
  CULTURAL_CONTEXT_VIEWED: 'cultural_context_viewed',
  
  // SRS events
  SRS_CARD_DUE: 'srs_card_due',
  SRS_CARD_ANSWERED: 'srs_card_answered',
  SRS_LEVEL_UP: 'srs_level_up',
};
