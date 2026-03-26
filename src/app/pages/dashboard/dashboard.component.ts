import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService, Group } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  groups = signal<Group[]>([]);
  isLoading = signal(true);
  error = signal('');
  
  username = signal<string>('User');

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUserId();
    const userData = this.authService.currentUserData();
    
    // Set username if available
    if (userData) {
      this.username.set(userData.name || userData.username || 'User');
    }

    if (!userId) {
      // Not logged in or missing userId -> redirect to login
      this.router.navigate(['/login']);
      return;
    }

    this.groupService.getGroupsByUser(userId).subscribe({
      next: (data) => {
        this.groups.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.error.set('Failed to load your houses. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
