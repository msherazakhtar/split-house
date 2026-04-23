import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GroupService, Group, GroupMember } from '../../../services/group.service';
import { AuthService } from '../../../services/auth.service';
import {
  LucideAngularModule,
  House,
  User,
  Users,
  TriangleAlert,
  X,
} from 'lucide-angular';

@Component({
  selector: 'app-groups',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css',
})
export class GroupsComponent implements OnInit {
  groups = signal<Group[]>([]);
  isLoading = signal(true);
  error = signal('');

  // Create/Edit Modal
  isCreateModalOpen = signal(false);
  addSelfAsMember = signal(true);
  groupToEdit = signal<Group | null>(null);
  newGroupName = signal('');
  isCreating = signal(false);
  createError = signal('');

  // Delete Modal
  isDeleteModalOpen = signal(false);
  groupToDelete = signal<Group | null>(null);
  isDeleting = signal(false);
  deleteError = signal('');

  // Add Member Modal
  isAddMemberModalOpen = signal(false);
  memberTargetGroup = signal<Group | null>(null);
  newMemberName = signal('');
  newMemberEmail = signal('');
  newMemberPhone = signal('');
  isAddingMember = signal(false);
  addMemberError = signal('');

  // Group Members Panel
  isGroupPanelOpen = signal(false);
  panelGroup = signal<Group | null>(null);
  panelMembers = signal<GroupMember[]>([]);
  isPanelLoading = signal(false);
  panelError = signal('');

  // Delete Member
  memberToDelete = signal<GroupMember | null>(null);
  isDeletingMember = signal(false);
  deleteMemberError = signal('');

  readonly House = House;
  readonly User = User;
  readonly Users = Users;
  readonly TriangleAlert = TriangleAlert;
  readonly X = X;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    const userId = this.authService.currentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);
    this.error.set('');
    this.groupService.getGroupsByUser(userId).subscribe({
      next: (data) => {
        this.groups.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.error.set('Failed to load your houses. Please try again later.');
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(event?: Event, group?: Group) {
    if (event) event.stopPropagation();

    if (group) {
      this.groupToEdit.set(group);
      this.newGroupName.set(group.name || group.title || '');
      this.addSelfAsMember.set(false);
    } else {
      this.groupToEdit.set(null);
      this.newGroupName.set('');
      this.addSelfAsMember.set(true);
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
      modifiedBy: actorEmail,
    };

    this.isCreating.set(true);
    this.createError.set('');

    this.groupService.createGroup(payload).subscribe({
      next: (newGroup) => {
        const finish = () => {
          this.isCreating.set(false);
          this.isCreateModalOpen.set(false);
          this.loadGroups();
        };

        if (!isEditing && this.addSelfAsMember()) {
          const groupIdFromResponse = newGroup?.groupId ?? newGroup?.id;

          if (groupIdFromResponse) {
            this.addSelfAsGroupMember(groupIdFromResponse, actorEmail, finish);
          } else {
            this.groupService.getGroupsByUser(userId!).subscribe({
              next: (groups) => {
                const created = groups.find(
                  (g) =>
                    (g.name || g.title)?.toLowerCase() ===
                    this.newGroupName().trim().toLowerCase(),
                );
                const groupId = created?.groupId ?? created?.id;
                if (groupId) {
                  this.addSelfAsGroupMember(groupId, actorEmail, finish);
                } else {
                  finish();
                }
              },
              error: () => finish(),
            });
          }
        } else {
          finish();
        }
      },
      error: (err) => {
        console.error('Error creating group:', err);
        this.isCreating.set(false);
        this.createError.set('Failed to create house. Please try again.');
      },
    });
  }

  private addSelfAsGroupMember(
    groupId: number | string,
    actorEmail: string,
    callback: () => void,
  ): void {
    const profile = this.authService.userDetails();
    const userData = this.authService.currentUserData();
    const fullName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
      : '';
    const username =
      fullName || profile?.name || profile?.username || userData?.name || userData?.username || 'User';
    const now = new Date().toISOString();
    const memberPayload: GroupMember = {
      name: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || username,
      email: profile?.email || actorEmail,
      phone: profile?.phone?.trim() || undefined,
      groupId: groupId,
      createdAt: now,
      createdBy: actorEmail,
      modifiedAt: now,
      modifiedBy: actorEmail,
    };
    this.groupService.addGroupMember(memberPayload).subscribe({
      next: () => callback(),
      error: (err) => {
        console.error('Failed to add self as member:', err);
        callback();
      },
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
        this.loadGroups();
      },
      error: (err) => {
        console.error('Error deleting group:', err);
        this.deleteError.set(`Failed to delete "${this.getGroupToDeleteName()}". Please try again.`);
        this.isDeleting.set(false);
      },
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

    const groupId = group.id != null ? group.id : group.groupId;
    if (groupId == null) {
      this.addMemberError.set('Could not identify the target group.');
      return;
    }

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
      modifiedBy: actorEmail,
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
      },
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
}
