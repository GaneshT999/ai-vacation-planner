# AI Vacation Planner 🌍✈️

A production-ready AI-powered vacation planning web application built with Angular, Firebase, and Gemini AI.

## Features

- 🤖 AI-powered personalized itinerary generation using Google Gemini
- 🔐 Secure Google authentication with Firebase Auth
- 💾 Cloud storage for trip history with Firestore
- 📱 Fully responsive, mobile-first design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast and scalable with Firebase Hosting and Cloud Functions

## Tech Stack

### Frontend

- **Angular 21** - Latest stable version with standalone components
- **Tailwind CSS 4** - Utility-first CSS framework
- **Angular Fire** - Official Angular library for Firebase
- **Reactive Forms** - Form handling with validation

### Backend

- **Firebase Authentication** - Google OAuth
- **Cloud Firestore** - NoSQL database for trip storage
- **Cloud Functions** - Serverless backend (Node 18)
- **Gemini AI** - Google's generative AI for itinerary creation

## Prerequisites

- Node.js 18 or higher
- npm 11 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Billing enabled (required for Cloud Functions)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase

The Firebase config is already set in `src/envinorments/envinorment.ts`. To use your own project, update the Firebase config there.

### 3. Set Up Gemini API Key

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

Get your key from: https://makersuite.google.com/app/apikey

### 4. Update Function URL

In `src/app/services/trip.service.ts`, update line 32 with your Firebase project ID:

```typescript
'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/generateTrip';
```

### 5. Enable Firebase Services

In Firebase Console (https://console.firebase.google.com):

- Enable Google Authentication
- Create Firestore database
- Ensure Blaze plan is active

### 6. Deploy

```bash
firebase deploy
```

### 7. Run Locally

### 7. Run Locally

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Vercel Serverless Functions

### `/api/generateTrip.js`

**Purpose**: Generates personalized vacation itineraries using Google Gemini AI

**Method**: `POST`

**Authentication**: Required (Firebase ID Token)

**Features**:

- 🔐 **Security**:
  - Firebase ID token verification
  - UID validation (request UID must match token)
  - Rate limiting (5 requests/minute per user)
  - CORS restricted to authorized domains
  - Security headers (XSS, Clickjacking, MIME sniffing protection)
- 🤖 **AI Integration**:
  - Direct REST API calls to Gemini 2.5 Flash
  - Fallback to Gemini 1.5 Flash and Gemini Pro
  - Configurable generation parameters (4096 tokens, 0.9 temperature)
- ✅ **Request Validation**:
  - Budget: Number, minimum $100
  - Days: Number, 1-30 range
  - Interests: String, minimum 10 characters
  - UID: Must match authenticated user

**Request Headers**:

```http
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "budget": 5000,
  "days": 7,
  "interests": "beaches, hiking, local cuisine",
  "uid": "user-firebase-uid"
}
```

**Response** (200 OK):

```json
{
  "budget": 5000,
  "days": 7,
  "interests": "beaches, hiking, local cuisine",
  "itinerary": "# 🌴 Your 7-Day Adventure\n\n## Day 1...",
  "createdAt": "2026-02-04T12:00:00.000Z",
  "uid": "user-firebase-uid"
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid Firebase token
- `403 Forbidden`: UID mismatch between token and request
- `429 Too Many Requests`: Rate limit exceeded
- `400 Bad Request`: Invalid parameters
- `405 Method Not Allowed`: Non-POST request
- `500 Internal Server Error`: AI generation failure

**Environment Variables**:

- `GEMINI_API_KEY`: Google Gemini API key (required)
- `FIREBASE_API_KEY`: Firebase Web API key for token verification (optional, has fallback)

**Rate Limiting**:

- In-memory Map-based rate limiting
- 5 requests per user per 60 seconds
- Resets on function cold start
- Per-user tracking via Firebase UID

**CORS Configuration**:

```javascript
const allowedOrigins = [
  'http://localhost:4200', // Development
  'https://angular-firebase-8762d.web.app', // Production
  'https://angular-firebase-8762d.firebaseapp.com', // Production
];
```

**Deployment**:

```bash
# Set environment variables
vercel env add GEMINI_API_KEY
vercel env add FIREBASE_API_KEY

# Deploy
vercel --prod
```

## Project Structure

```
ai-vacation-planner/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── login.component.ts          # Google login page
│   │   ├── trip-planner/
│   │   │   └── trip-planner.component.ts   # Main trip planner UI
│   │   ├── services/
│   │   │   ├── auth.service.ts             # Authentication service
│   │   │   └── trip.service.ts             # Trip generation service
│   │   ├── app.ts                          # Root component
│   │   ├── app.config.ts                   # App configuration
│   │   └── app.routes.ts                   # Routing configuration
│   ├── envinorments/
│   │   └── envinorment.ts                  # Environment config
│   └── styles.css                          # Global styles (Tailwind)
├── functions/
│   ├── index.js                            # Cloud Functions
│   └── package.json                        # Functions dependencies
├── firestore.rules                         # Database security rules
├── firebase.json                           # Firebase config
├── tailwind.config.js                      # Tailwind configuration
└── package.json                            # Project dependencies
```

## Architecture

### Frontend Flow

1. User lands on trip planner → redirected to login if not authenticated
2. User signs in with Google
3. User fills trip form (budget, days, interests) with validation
4. Form submission calls Cloud Function via HTTP
5. Loading state displayed during generation
6. AI-generated itinerary shown in beautiful card layout
7. User can copy itinerary or plan another trip

### Backend Flow

1. Cloud Function receives validated POST request
2. Constructs prompt for Gemini AI
3. Calls Gemini API
4. Saves trip to Firestore: `users/{uid}/trips/{tripId}`
5. Returns trip data to frontend

### Security

- All API keys stored in Cloud Functions environment
- Firestore rules enforce user can only access their own trips
- Authentication required for all operations
- Input validation on frontend and backend

## Firestore Data Structure

```
users/{uid}/trips/{tripId}
  ├── budget: number
  ├── days: number
  ├── interests: string
  ├── itinerary: string
  ├── createdAt: timestamp
  └── uid: string
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:

```bash
npm run build
firebase deploy
```

## Troubleshooting

**Function errors**: Check `firebase functions:log`

**Auth errors**: Verify Google sign-in enabled and domain authorized

**CORS errors**: Functions have CORS enabled, redeploy if needed

## License

MIT License

---

Built with ❤️ using Angular, Firebase, and Gemini AI

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
