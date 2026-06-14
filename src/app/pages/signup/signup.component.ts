import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, User, Lock, Eye, EyeOff, TriangleAlert, Check, Mail } from 'lucide-angular';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  readonly User = User;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly TriangleAlert = TriangleAlert;
  readonly Check = Check;
  readonly Mail = Mail;

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit() {
    this.errorMessage.set('');

    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (this.password.length < 4) {
      this.errorMessage.set('Password must be at least 4 characters.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(
      this.firstName.trim(),
      this.lastName.trim(),
      this.email.trim(),
      this.password
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Navigate to the verification page and pass the email so they don't have to re-enter it
        this.router.navigate(['/verify-email'], { queryParams: { email: this.email.trim() } });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Registration failed:', err);
        if (err.status === 409) {
          this.errorMessage.set('Email is already registered.');
        } else {
          this.errorMessage.set(err.error?.message || 'An error occurred during registration. Please try again.');
        }
      }
    });
  }
}
