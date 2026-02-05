import { Injectable, inject, signal } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any;
  lastLogin: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private googleProvider = new GoogleAuthProvider();
  
  // Observable of current user
  user$: Observable<User | null> = user(this.auth);
  
  // Signal for current user
  currentUser = signal<User | null>(null);

  constructor() {
    // Update signal when user changes
    this.user$.subscribe(user => this.currentUser.set(user));
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      if (result.user) {
        // Save user profile in background (non-blocking)
        this.saveUserProfile(result.user).catch(err => 
          console.error('Background user profile save failed:', err)
        );
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async saveUserProfile(user: User): Promise<void> {
    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      
      const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      // Use merge to avoid overwriting createdAt on existing users
      await setDoc(userRef, userData, { merge: true });
      console.log('User profile saved/updated');
    } catch (error) {
      console.error('Error saving user profile:', error);
      // Don't throw - this is a background operation
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return {
          uid: userDoc.id,
          ...userDoc.data()
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }
}
