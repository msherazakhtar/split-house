import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, Group, GroupMember } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  House,
  Receipt,
  Handshake,
  Settings,
  TriangleAlert,
  Construction,
  Menu,
  X,
  User,
  Users,
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  readonly House = House;
  readonly Receipt = Receipt;
  readonly Handshake = Handshake;
  readonly Settings = Settings;
  readonly TriangleAlert = TriangleAlert;
  readonly Construction = Construction;
  readonly Menu = Menu;
  readonly X = X;
  readonly User = User;
  readonly Users = Users;

  isMobileNavOpen = signal(false);

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

  // Add Member Modal State
  isAddMemberModalOpen = signal(false);
  memberTargetGroup = signal<Group | null>(null);
  newMemberName = signal('');
  newMemberEmail = signal('');
  newMemberPhone = signal('');
  isAddingMember = signal(false);
  addMemberError = signal('');

  // Group Members Panel State
  isGroupPanelOpen = signal(false);
  panelGroup = signal<Group | null>(null);
  panelMembers = signal<GroupMember[]>([]);
  isPanelLoading = signal(false);
  panelError = signal('');

  // Delete Member State
  memberToDelete = signal<GroupMember | null>(null);
  isDeletingMember = signal(false);
  deleteMemberError = signal('');

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
    this.isMobileNavOpen.set(false);
  }

  toggleMobileNav() {
    this.isMobileNavOpen.update((v) => !v);
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

  openAddMemberModal(event: Event, group: Group) {
    event.stopPropagation();
    this.memberTargetGroup.set(group);
    this.newMemberName.set('');
    this.newMemberEmail.set('');
    this.newMemberPhone.set('');
    this.addMemberError.set('');
    this.isAddMemberModalOpen.set(true);
  }

  closeAddMemberModal() {
    if (this.isAddingMember()) return;
    this.isAddMemberModalOpen.set(false);
    this.memberTargetGroup.set(null);
  }

  submitAddMember() {
    if (!this.newMemberName().trim()) {
      this.addMemberError.set('Member name is required.');
      return;
    }
    if (!this.newMemberEmail().trim()) {
      this.addMemberError.set('Email address is required.');
      return;
    }

    const group = this.memberTargetGroup();
    if (!group) return;

    console.log('[AddMember] group object:', group);

    const groupId = group.id != null ? group.id : group.groupId;
    if (groupId == null) {
      this.addMemberError.set('Could not identify the target group.');
      return;
    }

    console.log('[AddMember] resolved groupId:', groupId);

    const profile = this.authService.userDetails();
    const actorEmail = profile?.email || 'unknown@example.com';
    const now = new Date().toISOString();

    const payload: GroupMember = {
      name: this.newMemberName().trim(),
      email: this.newMemberEmail().trim(),
      phone: this.newMemberPhone().trim() || undefined,
      groupId: groupId,
      createdAt: now,
      createdBy: actorEmail,
      modifiedAt: now,
      modifiedBy: actorEmail
    };

    this.isAddingMember.set(true);
    this.addMemberError.set('');

    this.groupService.addGroupMember(payload).subscribe({
      next: () => {
        this.isAddingMember.set(false);
        this.closeAddMemberModal();
        const panelGroup = this.panelGroup();
        if (this.isGroupPanelOpen() && panelGroup) {
          this.loadGroupMembers(panelGroup);
        }
      },
      error: (err) => {
        console.error('Error adding member:', err);
        this.isAddingMember.set(false);
        this.addMemberError.set('Failed to add member. Please try again.');
      }
    });
  }

  confirmDeleteMember(member: GroupMember) {
    this.memberToDelete.set(member);
    this.deleteMemberError.set('');
  }

  cancelDeleteMember() {
    if (this.isDeletingMember()) return;
    this.memberToDelete.set(null);
    this.deleteMemberError.set('');
  }

  submitDeleteMember() {
    const member = this.memberToDelete();
    if (!member) return;

    const memberId = member.groupMemebrId;
    if (memberId == null) {
      this.deleteMemberError.set('Could not identify this member.');
      return;
    }

    this.isDeletingMember.set(true);
    this.deleteMemberError.set('');

    this.groupService.deleteGroupMember(memberId).subscribe({
      next: () => {
        this.isDeletingMember.set(false);
        this.memberToDelete.set(null);
        const panelGroup = this.panelGroup();
        if (panelGroup) this.loadGroupMembers(panelGroup);
      },
      error: (err) => {
        console.error('Error deleting member:', err);
        this.isDeletingMember.set(false);
        this.deleteMemberError.set('Failed to remove member. Please try again.');
      },
    });
  }

  openGroupPanel(event: Event, group: Group) {
    event.stopPropagation();
    this.panelGroup.set(group);
    this.panelMembers.set([]);
    this.panelError.set('');
    this.isGroupPanelOpen.set(true);
    this.loadGroupMembers(group);
  }

  closeGroupPanel() {
    this.isGroupPanelOpen.set(false);
    this.panelGroup.set(null);
  }

  loadGroupMembers(group: Group) {
    const groupId = group.id != null ? group.id : group.groupId;
    if (groupId == null) return;

    this.isPanelLoading.set(true);
    this.panelError.set('');

    this.groupService.getGroupMembers(groupId).subscribe({
      next: (members) => {
        this.panelMembers.set(members || []);
        this.isPanelLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load members:', err);
        this.panelError.set('Failed to load members. Please try again.');
        this.isPanelLoading.set(false);
      },
    });
  }

  openAddMemberFromPanel() {
    const group = this.panelGroup();
    if (!group) return;
    this.memberTargetGroup.set(group);
    this.newMemberName.set('');
    this.newMemberEmail.set('');
    this.newMemberPhone.set('');
    this.addMemberError.set('');
    this.isAddMemberModalOpen.set(true);
  }

  getMemberInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  formatMemberDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  logout() {
    this.isMobileNavOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
