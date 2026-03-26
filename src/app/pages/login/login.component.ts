import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    this.errorMessage.set('');
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
        console.error('Login failed:', err);
        // We can display a better message depending on err.status
        if (err.status === 401 || err.status === 403) {
          this.errorMessage.set('Invalid username or password.');
        } else {
          this.errorMessage.set('An error occurred. Please try again later.');
        }
      }
    });
  }
}
