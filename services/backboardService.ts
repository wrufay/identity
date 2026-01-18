// Backboard.io API integration for Gemini 1.5 Flash vision processing
// Enhanced with user preference-based personalization

import { LearningGoal, ProficiencyLevel, UserPrefs } from './userPreferences';

const BACKBOARD_API_URL = 'https://api.backboard.io/v1/completions';
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY || 'your-api-key-here';

export interface EnhancedGeminiResponse {
  item: string;
  chinese: string;
  pinyin: string;
  explanation: string;
  culturalContext: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleEnglish?: string;
}

interface BackboardRequestPayload {
  model: string;
  messages: Array<{
    role: string;
    content: Array<{
      type: string;
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Generate context-aware instructions based on user proficiency level
 */
function getProficiencyInstructions(level: ProficiencyLevel): string {
  const instructions = {
    absolute_beginner: `
- Use the most basic, essential vocabulary
- Include tone marks prominently in pinyin
- Provide simple, literal English translations
- Explain pronunciation tips if relevant
- Keep explanations very simple and clear
- Focus on practical, everyday usage`,

    beginner: `
- Use common, frequently-used vocabulary
- Include clear pinyin with tone marks
- Provide straightforward translations
- Add basic context about usage
- Keep explanations accessible
- Include simple example phrases`,

    intermediate: `
- Use natural, conversational language
- Include pinyin with proper tone marks
- Provide nuanced translations when appropriate
- Explain cultural context and usage scenarios
- Include idiomatic expressions where relevant
- Add example sentences showing usage`,

    advanced: `
- Use sophisticated and varied vocabulary
- Include pinyin for reference
- Provide nuanced translations with connotations
- Explain deep cultural and historical context
- Include literary or formal alternatives
- Add complex example sentences`,

    fluent: `
- Use native-level vocabulary and expressions
- Include advanced linguistic details
- Provide expert-level cultural insights
- Explain subtle connotations and regional variations
- Include classical or literary references
- Add sophisticated contextual usage examples`,
  };

  return instructions[level];
}

/**
 * Generate context based on learning goals
 */
function getGoalContext(goal: LearningGoal): string {
  const contexts = {
    travel: 'Focus on practical travel and navigation scenarios. Emphasize phrases useful for tourists.',
    culture_traditions: 'Emphasize cultural significance, traditions, and historical context. Explain cultural nuances.',
    business: 'Focus on professional and business contexts. Use formal language and business terminology.',
    conversation: 'Focus on everyday conversation and social interactions. Use casual, friendly language.',
    reading_writing: 'Emphasize character structure, etymology, and written usage. Include literary context.',
  };

  return contexts[goal];
}

/**
 * Generate user-personalized prompt for Gemini
 */
async function generatePersonalizedPrompt(): Promise<string> {
  const prefs = await UserPrefs.getPreferences();
  
  // Use defaults if onboarding not completed
  const level = prefs.proficiencyLevel || 'beginner';
  const goal = prefs.learningGoal || 'conversation';
  
  const levelInstructions = getProficiencyInstructions(level);
  const goalContext = getGoalContext(goal);
  
  return `You are a Chinese language teacher helping a ${level.replace('_', ' ')} level learner.

LEARNING CONTEXT:
${goalContext}

TEACHING APPROACH:
${levelInstructions}

Your task: Analyze the image and identify the main object, then provide a learning response tailored to this student's level and goals.`;
}

/**
 * Analyze image with user-personalized context
 * @param base64Image - Base64 encoded image string
 * @returns Promise with enhanced, personalized response
 */
export async function analyzeImageWithGemini(
  base64Image: string
): Promise<EnhancedGeminiResponse | null> {
  try {
    const personalizedPrompt = await generatePersonalizedPrompt();
    const prefs = await UserPrefs.getPreferences();
    const level = prefs.proficiencyLevel || 'beginner';
    
    // Adjust max_tokens based on proficiency level
    const maxTokens = level === 'absolute_beginner' || level === 'beginner' ? 300 : 500;
    
    const payload: BackboardRequestPayload = {
      model: 'gemini-1.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${personalizedPrompt}

Return a JSON object with this EXACT structure (all fields required):
{
  "item": "English name of the object",
  "chinese": "Chinese translation (simplified characters)",
  "pinyin": "Pinyin with tone marks",
  "explanation": "Brief explanation tailored to their level",
  "culturalContext": "Cultural information appropriate for their level and goals",
  "exampleSentence": "Example sentence in Chinese using this word",
  "examplePinyin": "Pinyin of the example sentence",
  "exampleEnglish": "English translation of the example"
}

If no clear object is visible, return empty strings for all fields.
IMPORTANT: Return ONLY the JSON object, no additional text or markdown.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    };

    const response = await fetch(BACKBOARD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKBOARD_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backboard API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Backboard response');
      return null;
    }

    // Parse the JSON from the content
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonText) as EnhancedGeminiResponse;

    // Validate required fields
    if (
      typeof parsed.item === 'string' &&
      typeof parsed.chinese === 'string' &&
      typeof parsed.pinyin === 'string' &&
      typeof parsed.explanation === 'string' &&
      typeof parsed.culturalContext === 'string'
    ) {
      // Only return if we have actual content
      if (parsed.item && parsed.chinese && parsed.pinyin) {
        console.log(`✅ Personalized response for ${level} level learner`);
        return parsed;
      }
    }

    return null;
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    return null;
  }
}

/**
 * Validates if a vision response has meaningful content
 */
export function isValidVisionResponse(
  response: EnhancedGeminiResponse | null
): response is EnhancedGeminiResponse {
  return (
    response !== null &&
    response.item.length > 0 &&
    response.chinese.length > 0 &&
    response.pinyin.length > 0
  );
}

/**
 * Additional context response structure
 */
export interface AdditionalContextResponse {
  sentence: string;        // Chinese sentence
  pinyin: string;          // Pinyin of sentence
  english: string;         // English translation
  explanation: string;     // Why this sentence is relevant
  difficulty: string;      // Level indicator
}

/**
 * Generate additional contextual sentence about an item
 * Personalized based on user preferences
 * @param itemEnglish - English name of the item
 * @param itemChinese - Chinese name of the item
 * @returns Promise with additional learning content
 */
export async function generateAdditionalContext(
  itemEnglish: string,
  itemChinese: string
): Promise<AdditionalContextResponse | null> {
  try {
    const prefs = await UserPrefs.getPreferences();
    const level = prefs.proficiencyLevel || 'beginner';
    const goal = prefs.learningGoal || 'conversation';
    
    const levelInstructions = getProficiencyInstructions(level);
    const goalContext = getGoalContext(goal);
    
    const prompt = `You are a Chinese language teacher helping a ${level.replace('_', ' ')} level learner.

LEARNING CONTEXT:
${goalContext}

TEACHING APPROACH:
${levelInstructions}

The student just learned the word "${itemChinese}" (${itemEnglish}).

Generate ONE interesting, practical sentence that uses this word. The sentence should:
- Be appropriate for their proficiency level
- Relate to their learning goals
- Teach something new or reinforce the vocabulary
- Be culturally relevant and useful

Return a JSON object with this EXACT structure:
{
  "sentence": "Chinese sentence using ${itemChinese}",
  "pinyin": "Full pinyin with tone marks",
  "english": "English translation",
  "explanation": "Brief note on why this sentence is useful or interesting",
  "difficulty": "easy|medium|hard (relative to their level)"
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown.`;

    const payload: BackboardRequestPayload = {
      model: 'gemini-1.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      temperature: 0.7, // Higher temperature for more creative sentences
      max_tokens: 400,
    };

    const response = await fetch(BACKBOARD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKBOARD_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backboard API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Backboard response');
      return null;
    }

    // Parse the JSON from the content
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonText) as AdditionalContextResponse;

    // Validate required fields
    if (
      typeof parsed.sentence === 'string' &&
      typeof parsed.pinyin === 'string' &&
      typeof parsed.english === 'string' &&
      parsed.sentence && parsed.pinyin && parsed.english
    ) {
      console.log(`✅ Generated additional context for ${itemChinese}`);
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Error generating additional context:', error);
    return null;
  }
}
