/**
 * Vercel Serverless Function to generate trip itinerary using Gemini AI
 * Uses direct REST API calls to avoid SDK versioning issues
 * SECURED: Requires Firebase ID token, rate limiting, and origin validation
 *
 * Request headers:
 * - Authorization: Bearer <firebase-id-token>
 *
 * Request body:
 * {
 *   budget: number,
 *   days: number,
 *   interests: string,
 *   uid: string
 * }
 */

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 5; // Max 5 requests
const RATE_WINDOW = 60 * 1000; // Per 1 minute

module.exports = async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Restrict CORS to your domains only
  const allowedOrigins = [
    'http://localhost:4200',
    'https://angular-firebase-8762d.web.app',
    'https://angular-firebase-8762d.firebaseapp.com',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token by checking with Firebase REST API
    let verifiedUid;
    try {
      const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY || 'AIzaSyA51aalnhCOf8F6p_-YzQlGvBSY7Jfcep0'}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!verifyResponse.ok) {
        return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
      }

      const verifyData = await verifyResponse.json();
      verifiedUid = verifyData.users[0].localId;
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }

    // Validate request body
    const { budget, days, interests, uid } = req.body;

    // Ensure the uid in the request matches the verified token
    if (uid !== verifiedUid) {
      return res.status(403).json({ error: 'Forbidden: UID mismatch' });
    }

    // Rate limiting check
    const now = Date.now();
    const userLimit = rateLimitMap.get(uid) || { count: 0, resetTime: now + RATE_WINDOW };

    if (now > userLimit.resetTime) {
      // Reset window
      userLimit.count = 0;
      userLimit.resetTime = now + RATE_WINDOW;
    }

    if (userLimit.count >= RATE_LIMIT) {
      return res.status(429).json({
        error: 'Too many requests. Please try again in a minute.',
      });
    }

    userLimit.count++;
    rateLimitMap.set(uid, userLimit);

    if (!budget || !days || !interests || !uid) {
      return res.status(400).json({
        error: 'Missing required fields: budget, days, interests, uid',
      });
    }

    // Validate types
    if (typeof budget !== 'number' || budget < 100) {
      return res.status(400).json({
        error: 'Budget must be a number and at least 100',
      });
    }

    if (typeof days !== 'number' || days < 1 || days > 30) {
      return res.status(400).json({
        error: 'Days must be a number between 1 and 30',
      });
    }

    if (typeof interests !== 'string' || interests.length < 10) {
      return res.status(400).json({
        error: 'Interests must be a string with at least 10 characters',
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({
        error: 'Server configuration error. Please contact support.',
      });
    }

    // Generate prompt for Gemini
    const prompt = `Create a comprehensive ${days}-day vacation itinerary with a budget of $${budget} USD.

Traveler's interests: ${interests}

Provide a detailed response with specific recommendations. Structure your response EXACTLY like this markdown format:

# 🌴 Your ${days}-Day Adventure

## Day 1: [Day Title]

### Morning
- **Activity:** [Specific activity with location]
- **Cost:** $XX
- **Tips:** [Quick insider tip]

### Afternoon
- **Lunch:** [Restaurant name]
- **Cost:** $XX
- **Activity:** [Main afternoon activity]
- **Cost:** $XX

### Evening
- **Dinner:** [Restaurant recommendation]
- **Cost:** $XX
- **Activity:** [Evening plan]
- **Cost:** $XX

### Accommodation
- **Hotel:** [Hotel name and area]
- **Cost:** $XX/night

**Day 1 Total: $XXX**

---

[Repeat format for all ${days} days]

---

## 💰 Budget Breakdown

| Category | Amount |
|----------|--------|
| Accommodation | $XXX |
| Food & Dining | $XXX |
| Activities | $XXX |
| Transportation | $XXX |
| **Total** | **$XXX** |

## 💡 Money-Saving Tips
- [3-4 practical tips]

## 📝 Travel Essentials
- [What to pack and prepare]

Make each recommendation specific with actual names and prices!`;

    // Call Gemini API directly using REST API (stable v1 endpoint)
    // Using gemini-2.5-flash (current stable model in 2026)
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
    let itinerary = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 4096,
              temperature: 0.9,
              topP: 0.95,
              topK: 40,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Model ${modelName} failed:`, response.status, errorData);
          lastError = new Error(`API returned ${response.status}: ${errorData}`);
          continue; // Try next model
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          itinerary = data.candidates[0].content.parts[0].text;
          console.log(`Successfully used model: ${modelName}`);
          break; // Success! Exit loop
        }
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        lastError = error;
        continue; // Try next model
      }
    }

    if (!itinerary) {
      throw lastError || new Error('Failed to generate itinerary from AI');
    }

    // Return the trip data
    return res.status(200).json({
      budget,
      days,
      interests,
      itinerary,
      createdAt: new Date().toISOString(),
      uid,
    });
  } catch (error) {
    console.error('Error generating trip:', error);

    // Return appropriate error message
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        error: 'API configuration error. Please try again later.',
      });
    }

    return res.status(500).json({
      error: 'Failed to generate trip. Please try again.',
      details: error.message,
    });
  }
};
