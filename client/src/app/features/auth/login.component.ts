import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CouncilApiService } from '../../council-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly api = inject(CouncilApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  onSubmit() {
    if (!this.username.trim() || !this.password) {
      this.errorMessage.set('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.auth.setSession(res.user, res.token);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    });
  }
}
