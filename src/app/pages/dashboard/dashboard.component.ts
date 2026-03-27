import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, Group } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  groups = signal<Group[]>([]);
  isLoading = signal(true);
  error = signal('');
  
  username = signal<string>('User');
  activeTab = signal<string>('groups');

  // Create/Edit Modal State
  isCreateModalOpen = signal(false);
  groupToEdit = signal<Group | null>(null);
  newGroupName = signal('');
  isCreating = signal(false);
  createError = signal('');

  // Delete Modal State
  isDeleteModalOpen = signal(false);
  groupToDelete = signal<Group | null>(null);
  isDeleting = signal(false);
  deleteError = signal('');

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  loadGroups(): void {
    const userId = this.authService.currentUserId();
    const userData = this.authService.currentUserData();
    
    // Set username if available
    if (userData) {
      this.username.set(userData.name || userData.username || 'User');
    }

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
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

  openCreateModal(event?: Event, group?: Group) {
    if (event) event.stopPropagation();
    
    if (group) {
      this.groupToEdit.set(group);
      this.newGroupName.set(group.name || group.title || '');
    } else {
      this.groupToEdit.set(null);
      this.newGroupName.set('');
    }
    
    this.createError.set('');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
    this.groupToEdit.set(null);
  }

  submitCreateGroup() {
    if (!this.newGroupName().trim()) {
      this.createError.set('House name is required.');
      return;
    }

    const userId = this.authService.currentUserId();
    const profile = this.authService.userDetails();
    const actorEmail = profile?.email || 'unknown@example.com';
    const now = new Date().toISOString();
    
    const editingGroup = this.groupToEdit();
    const isEditing = !!editingGroup;

    const payload = {
      id: isEditing ? (editingGroup.id || editingGroup.groupId) : null,
      name: this.newGroupName().trim(),
      userId: userId,
      createdAt: isEditing ? (editingGroup['createdAt'] || now) : now,
      createdBy: isEditing ? (editingGroup['createdBy'] || actorEmail) : actorEmail,
      modifiedAt: now,
      modifiedBy: actorEmail
    };

    this.isCreating.set(true);
    this.createError.set('');

    this.groupService.createGroup(payload).subscribe({
      next: (newGroup) => {
        this.isCreating.set(false);
        this.isCreateModalOpen.set(false);
        this.loadGroups();
      },
      error: (err) => {
        console.error('Error creating group:', err);
        this.isCreating.set(false);
        this.createError.set('Failed to create house. Please try again.');
      }
    });
  }

  openDeleteModal(event: Event, group: Group) {
    event.stopPropagation();
    this.groupToDelete.set(group);
    this.deleteError.set('');
    this.isDeleteModalOpen.set(true);
  }

  getGroupToDeleteName(): string {
    const g = this.groupToDelete();
    if (!g) return '';
    return g.name || g.title || 'this house';
  }

  closeDeleteModal() {
    if (this.isDeleting()) return;
    this.isDeleteModalOpen.set(false);
    this.groupToDelete.set(null);
  }

  confirmDelete() {
    const group = this.groupToDelete();
    if (!group) return;

    // Check robustly for any sort of ID signature
    const targetId = group.id || group.groupId;
    
    if (!targetId) {
      console.warn('Cannot delete house: missing ID in payload', group);
      this.deleteError.set('Could not identify the house to delete.');
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set('');

    this.groupService.deleteGroup(targetId).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.loadGroups(); // re-fetch the list
      },
      error: (err) => {
        console.error('Error deleting group:', err);
        this.deleteError.set(`Failed to delete "${this.getGroupToDeleteName()}". Please try again.`);
        this.isDeleting.set(false);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
