import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-landing',
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center px-4" style="background-image: url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'); background-size: cover; background-attachment: fixed; background-blend-mode: overlay;">
      <div class="max-w-4xl w-full">
        <!-- Hero Section -->
        <div class="text-center mb-12 animate-fadeIn">
          
          
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl mt-20">
            AI Vacation Planner
          </h1>
          
          <p class="text-xl md:text-2xl text-white/90 mb-4 drop-shadow-lg">
            Your Dream Vacation, Perfectly Planned by AI
          </p>
          
          <p class="text-lg text-white/80 max-w-2xl mx-auto mb-12 drop-shadow-lg">
            Get personalized day-by-day itineraries tailored to your budget, interests, and travel style. 
            Powered by Google Gemini AI.
          </p>

          <!-- Features Grid -->
          <div class="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
              <div class="h-12 w-12 bg-white/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Smart Planning</h3>
              <p class="text-white/90 text-sm">AI-powered recommendations based on your preferences</p>
            </div>

            <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
              <div class="h-12 w-12 bg-white/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Budget Friendly</h3>
              <p class="text-white/90 text-sm">Get detailed cost breakdowns and money-saving tips</p>
            </div>

            <div class="bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
              <div class="h-12 w-12 bg-white/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Save & Revisit</h3>
              <p class="text-white/90 text-sm">All your trips saved securely in the cloud</p>
            </div>
          </div>

          @if (loading()) {
            <div class="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md mx-auto border border-white/30">
              <div class="flex items-center justify-center gap-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span class="text-white font-medium">Signing you in...</span>
              </div>
            </div>
          } @else {
            <!-- Sign In Button -->
            <div class="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md mx-auto transform hover:scale-105 transition-transform border border-white/30">
              <h2 class="text-2xl font-bold text-white mb-6">Get Started</h2>
              
              <button
                (click)="signInWithGoogle()"
                class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-white/50 rounded-xl hover:bg-white/90 hover:border-white transition-all shadow-lg hover:shadow-xl font-medium text-gray-900"
              >
                <svg class="h-6 w-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <p class="text-sm text-white/80 mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          }
        </div>

        <!-- Stats Section -->
        <div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-12">
          <div class="text-center">
            <div class="text-3xl font-bold text-white drop-shadow-lg">AI</div>
            <div class="text-white/70 text-sm">Powered</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white drop-shadow-lg">24/7</div>
            <div class="text-white/70 text-sm">Available</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white drop-shadow-lg">Free</div>
            <div class="text-white/70 text-sm">To Start</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.8s ease-out;
    }
  `]
})
export class LandingComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loading = this.authService.currentUser;

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      // Redirect to planner after successful login
      this.router.navigate(['/planner']);
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  }
}
