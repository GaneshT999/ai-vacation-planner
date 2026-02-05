import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TripService, Trip } from '../services/trip.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-trip-planner',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trip-planner.component.html',
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out;
    }
  `]
})
export class TripPlannerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  loading = signal(false);
  loadingHistory = signal(false);
  error = signal<string | null>(null);
  currentTrip = signal<Trip | null>(null);
  tripHistory = signal<Trip[]>([]);
  user = this.authService.currentUser;

  // Computed signal to render markdown as HTML
  renderedItinerary = computed(() => {
    const trip = this.currentTrip();
    if (!trip) return this.sanitizer.sanitize(1, '');
    
    const html = marked(trip.itinerary, { 
      breaks: true,
      gfm: true 
    });
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  });

  tripForm: FormGroup = this.fb.group({
    budget: [null, [Validators.required, Validators.min(100)]],
    days: [null, [Validators.required, Validators.min(1), Validators.max(30)]],
    interests: ['', [Validators.required, Validators.minLength(10)]]
  });

  async ngOnInit() {
    // Load trip history with a slight delay to prioritize main content
    setTimeout(() => this.loadTripHistory(), 300);
  }

  async loadTripHistory() {
    if (this.tripHistory().length > 0) {
      // Already loaded, skip
      return;
    }
    
    this.loadingHistory.set(true);
    try {
      const trips = await this.tripService.getUserTrips();
      this.tripHistory.set(trips);
    } catch (error) {
      console.error('Error loading trip history:', error);
    } finally {
      this.loadingHistory.set(false);
    }
  }

  async generateTrip() {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.error.set('Please sign in to generate a trip');
      await this.router.navigate(['/login']);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.currentTrip.set(null);

    try {
      const { budget, days, interests } = this.tripForm.value;
      const trip = await this.tripService.generateTrip(budget, days, interests);
      this.currentTrip.set(trip);
      
      // Navigate to results page
      await this.router.navigate(['/results', trip.id]);
    } catch (error: any) {
      this.error.set(error.message || 'Failed to generate trip. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  viewTrip(tripId: string) {
    this.router.navigate(['/results', tripId]);
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  resetForm() {
    this.tripForm.reset();
    this.currentTrip.set(null);
    this.error.set(null);
  }

  async copyToClipboard() {
    const trip = this.currentTrip();
    if (trip) {
      try {
        await navigator.clipboard.writeText(trip.itinerary);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }

  async signOut() {
    try {
      await this.authService.signOut();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
