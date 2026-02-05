import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TripService, Trip } from '../services/trip.service';
import { AuthService } from '../services/auth.service';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-trip-results',
  imports: [CommonModule],
  templateUrl: './trip-results.component.html',
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
      animation: fadeIn 0.5s ease-out;
    }
  `]
})
export class TripResultsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  loading = signal(false);
  trip = signal<Trip | null>(null);
  user = this.authService.currentUser;

  renderedItinerary = computed(() => {
    const currentTrip = this.trip();
    if (!currentTrip) return this.sanitizer.sanitize(1, '');
    
    const html = marked(currentTrip.itinerary, { 
      breaks: true,
      gfm: true 
    });
    return this.sanitizer.bypassSecurityTrustHtml(html as string);
  });

  async ngOnInit() {
    const tripId = this.route.snapshot.paramMap.get('id');
    
    if (tripId) {
      await this.loadTrip(tripId);
    }
  }

  async loadTrip(tripId: string) {
    this.loading.set(true);
    try {
      const trip = await this.tripService.getTripById(tripId);
      this.trip.set(trip);
    } catch (error) {
      console.error('Error loading trip:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async copyToClipboard() {
    const currentTrip = this.trip();
    if (currentTrip) {
      try {
        await navigator.clipboard.writeText(currentTrip.itinerary);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }

  goToPlanner() {
    this.router.navigate(['/planner']);
  }

  async signOut() {
    try {
      await this.authService.signOut();
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
