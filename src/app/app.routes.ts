import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login.component';
import { TripPlannerComponent } from './trip-planner/trip-planner.component';
import { TripResultsComponent } from './trip-results/trip-results.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'planner', component: TripPlannerComponent },
  { path: 'results/:id', component: TripResultsComponent },
  { path: '**', redirectTo: '' }
];
