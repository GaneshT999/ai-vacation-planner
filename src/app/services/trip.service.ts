import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, getDoc, doc, CollectionReference, orderBy, limit } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

export interface TripRequest {
  budget: number;
  days: number;
  interests: string;
  uid: string;
}

export interface Trip {
  id?: string;
  budget: number;
  days: number;
  interests: string;
  itinerary: string;
  createdAt: Date;
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private tripsCache = new Map<string, Trip[]>();
  private cacheTimestamp = new Map<string, number>();
  private CACHE_DURATION = 60000; // 1 minute cache

  async generateTrip(budget: number, days: number, interests: string): Promise<Trip> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to generate a trip');
    }

    const tripRequest: TripRequest = {
      budget,
      days,
      interests,
      uid: user.uid
    };

    try {
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      // Call Vercel Serverless Function with authentication
      const response = await fetch(
        'https://ai-vacation-planner-brown.vercel.app/api/generateTrip',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(tripRequest)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate trip');
      }

      const trip = await response.json();
      
      // Save trip to Firestore
      const savedTrip = await this.saveTrip(trip);
      return savedTrip;
    } catch (error) {
      console.error('Error generating trip:', error);
      throw error;
    }
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to save a trip');
    }

    try {
      const tripsRef = collection(this.firestore, `users/${user.uid}/trips`);
      const docRef = await addDoc(tripsRef, {
        ...trip,
        createdAt: new Date()
      });
      
      // Clear cache so next fetch gets updated list
      this.clearCache();
      
      return {
        ...trip,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error saving trip:', error);
      throw error;
    }
  }

  async getTripById(tripId: string): Promise<Trip> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const tripRef = doc(this.firestore, `users/${user.uid}/trips`, tripId);
      const tripDoc = await getDoc(tripRef);
      
      if (!tripDoc.exists()) {
        throw new Error('Trip not found');
      }

      return {
        id: tripDoc.id,
        ...tripDoc.data()
      } as Trip;
    } catch (error) {
      console.error('Error fetching trip:', error);
      throw error;
    }
  }

  async getUserTrips(forceRefresh = false): Promise<Trip[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return [];
    }

    // Check cache
    const cacheKey = user.uid;
    const cachedTime = this.cacheTimestamp.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cachedTime && (now - cachedTime) < this.CACHE_DURATION) {
      const cached = this.tripsCache.get(cacheKey);
      if (cached) {
        console.log('Using cached trips');
        return cached;
      }
    }

    try {
      const tripsRef = collection(this.firestore, `users/${user.uid}/trips`) as CollectionReference;
      // Try without orderBy first (faster, no index needed)
      const q = query(tripsRef, limit(10));
      const querySnapshot = await getDocs(q);
      
      const trips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Trip));
      
      // Sort in memory (faster than Firestore orderBy)
      trips.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Cache the results
      this.tripsCache.set(cacheKey, trips);
      this.cacheTimestamp.set(cacheKey, now);
      
      return trips;
    } catch (error) {
      console.error('Error fetching trips:', error);
      return [];
    }
  }

  // Clear cache when a new trip is saved
  clearCache() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.tripsCache.delete(user.uid);
      this.cacheTimestamp.delete(user.uid);
    }
  }
}
