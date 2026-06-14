import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, User, Lock, Eye, EyeOff, TriangleAlert, Check } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly User = User;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly TriangleAlert = TriangleAlert;
  readonly Check = Check;

  username = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  isUnverifiedError = signal(false);
  unverifiedEmail = '';

  constructor(private authService: AuthService, private router: Router) { }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    this.errorMessage.set('');
    this.isUnverifiedError.set(false);
    if (!this.username || !this.password) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Login failed:', err.error?.Error);
        
        const errorMsg = err.error?.Error || '';
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set(errorMsg);
          if (errorMsg.includes('Your email is not verified. Please verify your email via OTP.')) {
            this.isUnverifiedError.set(true);
            this.unverifiedEmail = this.username;
          }
        } else {
          this.errorMessage.set('An error occurred. Please try again later.');
        }
      }
    });
  }

  resendOtpAndVerify() {
    if (!this.unverifiedEmail) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.resendOtp(this.unverifiedEmail).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Navigate to /verify-email?email=<email>
        this.router.navigate(['/verify-email'], {
          queryParams: { email: this.unverifiedEmail }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to generate new OTP:', err);
        this.errorMessage.set(
          err.error?.responseMessage ||
          err.error?.message ||
          'Failed to resend verification code. Please try again later.'
        );
      }
    });
  }
}
