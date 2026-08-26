import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'ashour_auth_user';
  private readonly TOKEN_KEY = 'ashour_auth_token';

  currentUser = signal<UserDto | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  constructor(private router: Router) {}

  private getStoredUser(): UserDto | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setSession(user: UserDto, token: string) {
    this.currentUser.set(user);
    this.token.set(token);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  logout() {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/']);
  }
}
