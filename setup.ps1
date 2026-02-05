# Setup Script for AI Vacation Planner

Write-Host "🌍 AI Vacation Planner - Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Node version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Install Cloud Functions dependencies
Write-Host "📦 Installing Cloud Functions dependencies..." -ForegroundColor Yellow
Set-Location functions
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install functions dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Cloud Functions dependencies installed" -ForegroundColor Green
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "Firebase CLI version: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firebase CLI not found. Install it with:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get Gemini API key from: https://makersuite.google.com/app/apikey" -ForegroundColor White
Write-Host "2. Set API key: firebase functions:config:set gemini.api_key='YOUR_KEY'" -ForegroundColor White
Write-Host "3. Update function URL in src/app/services/trip.service.ts" -ForegroundColor White
Write-Host "4. Enable Google Auth in Firebase Console" -ForegroundColor White
Write-Host "5. Create Firestore database in Firebase Console" -ForegroundColor White
Write-Host "6. Run locally: npm start" -ForegroundColor White
Write-Host "7. Deploy: firebase deploy" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
