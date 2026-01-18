# Backboard.io API Setup

This project uses Backboard.io to access Gemini 1.5 Flash vision API for real-time object recognition.

## Setup Instructions

1. **Get your Backboard.io API Key**
   - Sign up at [https://backboard.io](https://backboard.io)
   - Navigate to your API settings
   - Copy your API key

2. **Configure the API Key**
   
   You have two options:

   **Option A: Environment Variable (Recommended)**
   ```bash
   export BACKBOARD_API_KEY="your-api-key-here"
   ```

   **Option B: Direct in Code (for testing only)**
   - Open `/services/backboardService.ts`
   - Replace `'your-api-key-here'` with your actual API key
   - ⚠️ Never commit API keys to version control

3. **Test the Integration**
   - Launch the app
   - Tap "VR Mode"
   - Tap the "▶ Auto" button in the top-right corner
   - The app will now capture images every 3 seconds and display translations

## How It Works

- **Auto-capture**: When enabled in VR mode, captures an image every 3 seconds
- **Gemini Vision**: Each image is sent to Gemini 1.5 Flash via Backboard.io
- **Real-time Translation**: Results are displayed on both left and right eye overlays
- **Response Format**: 
  ```json
  {
    "item": "English name",
    "chinese": "中文",
    "pinyin": "pīnyīn"
  }
  ```

## API Endpoint

- **URL**: `https://api.backboard.io/v1/completions`
- **Model**: `gemini-1.5-flash`
- **Method**: POST
- **Content-Type**: application/json

## Troubleshooting

- **No results showing**: Check console logs for API errors
- **Authentication failed**: Verify your API key is correct
- **Rate limiting**: Backboard.io may have rate limits - adjust the 3-second interval if needed
- **Empty responses**: Gemini may not recognize objects in low-light or unclear images
