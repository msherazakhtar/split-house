import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, TriangleAlert, Check, KeyRound, ShieldCheck } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  readonly Mail = Mail;
  readonly TriangleAlert = TriangleAlert;
  readonly Check = Check;
  readonly KeyRound = KeyRound;
  readonly ShieldCheck = ShieldCheck;

  email = '';
  verificationCode = '';
  isLoading = signal(false);
  isSuccess = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.verificationCode.trim()) {
      this.errorMessage.set('Please enter the verification code.');
      return;
    }

    if (this.verificationCode.trim().length < 4) {
      this.errorMessage.set('Verification code should be at least 4 digits/characters.');
      return;
    }

    this.isLoading.set(true);

    this.authService.verifyOtp(this.email, this.verificationCode.trim()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.responseStatus === 'SUCCESS') {
          this.isSuccess.set(true);
          this.successMessage.set(res.responseData || 'Email verified successfully!');
          // Auto-redirect to login screen after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/protectedLoginBeta']);
          }, 2000);
        } else {
          this.errorMessage.set(res.responseMessage || 'Verification failed. Please try again.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Verification failed:', err);
        this.errorMessage.set(
          err.error?.responseMessage ||
          err.error?.message ||
          'Invalid verification code. Please try again.'
        );
      }
    });
  }

  resendCode() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.email) {
      this.errorMessage.set('Email address is missing. Please go back to the signup page.');
      return;
    }

    this.isLoading.set(true);

    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.responseStatus === 'SUCCESS') {
          this.successMessage.set(res.responseData || 'New OTP has been sent successfully.');
        } else {
          this.errorMessage.set(res.responseMessage || 'Failed to resend verification code.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to resend OTP:', err);
        this.errorMessage.set(
          err.error?.responseMessage ||
          err.error?.message ||
          'Failed to resend verification code. Please try again later.'
        );
      }
    });
  }
}
