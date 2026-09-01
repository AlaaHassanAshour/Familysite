import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing/landing-page.component';
import { LoginComponent } from './features/auth/login.component';
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { MembersPageComponent } from './features/members/members-page.component';
import { UsersPageComponent } from './features/users/users-page.component';
import { AlbumsPageComponent } from './features/albums/albums-page.component';
import { FinancePageComponent } from './features/finance/finance-page.component';
import { CommitteesPageComponent } from './features/committees/committees-page.component';
import { ActivitiesPageComponent } from './features/activities/activities-page.component';
import { UpcomingEventsPageComponent } from './features/upcoming-events/upcoming-events-page.component';
import { DecisionsPageComponent } from './features/decisions/decisions-page.component';
import { SettingsPageComponent } from './features/settings/settings-page.component';
import { authGuard } from './guards/auth.guard';
import { SlidersComponent } from './features/sliders/sliders';

export const routes: Routes = [
  // Public Landing Page
  { path: '', component: LandingPageComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Admin Dashboard (Protected Routes)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'members', component: MembersPageComponent },
      { path: 'users', component: UsersPageComponent },
      { path: 'albums', component: AlbumsPageComponent },
      { path: 'finance', component: FinancePageComponent },
      { path: 'committees', component: CommitteesPageComponent },
      { path: 'activities', component: ActivitiesPageComponent },
      { path: 'upcoming-events', component: UpcomingEventsPageComponent },
      { path: 'decisions', component: DecisionsPageComponent },
      { path: 'settings', component: SettingsPageComponent },
      { path: 'sliders', component: SlidersComponent }
    ]
  },

  // Fallbacks & Redirects
  { path: 'dashboard', redirectTo: 'admin/dashboard' },
  { path: 'members', redirectTo: 'admin/members' },
  { path: 'committees', redirectTo: 'admin/committees' },
  { path: 'activities', redirectTo: 'admin/activities' },
  { path: 'decisions', redirectTo: 'admin/decisions' },
  { path: 'sliders', redirectTo: 'admin/sliders' },
  { path: 'decisions', redirectTo: 'admin/decisions' },
  { path: 'settings', redirectTo: 'admin/settings' },
  { path: '**', redirectTo: '' }
];
