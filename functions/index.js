const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Firebase Admin
admin.initializeApp();

// Define secret parameter for Gemini API key
const geminiApiKey = defineString('GEMINI_API_KEY');

// Initialize Gemini AI will happen inside the function

/**
 * Cloud Function to generate trip itinerary using Gemini AI
 *
 * Request body:
 * {
 *   budget: number,
 *   days: number,
 *   interests: string,
 *   uid: string
 * }
 */
exports.generateTrip = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Validate request body
      const { budget, days, interests, uid } = req.body;

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
      const prompt = `Create a detailed ${days}-day vacation itinerary with a budget of $${budget} USD.

Traveler's interests: ${interests}

Please provide:
1. A day-by-day breakdown of activities
2. Estimated costs for major expenses (accommodation, food, activities, transport)
3. Specific recommendations for places to visit, restaurants, and experiences
4. Budget-conscious tips and alternatives where appropriate
5. Travel tips and best times to visit certain attractions

Format the response in a clear, readable way with proper headings for each day.
Make it practical, detailed, and exciting!`;

      // Call Gemini AI
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const itinerary = response.text();

      if (!itinerary) {
        throw new Error('Failed to generate itinerary from AI');
      }

      // Save to Firestore
      const tripData = {
        budget,
        days,
        interests,
        itinerary,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uid,
      };

      const tripRef = await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('trips')
        .add(tripData);

      // Return the trip data with the ID
      return res.status(200).json({
        id: tripRef.id,
        ...tripData,
        createdAt: new Date(),
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
      });
    }
  },
);
