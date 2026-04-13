import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, Group, GroupMember } from '../../services/group.service';
import {
  ExpenseService,
  Expense,
  ExpenseDetailCore,
  ExpenseDetailResponse,
  ExpenseMemberDetail,
  CreateExpenseRequest,
} from '../../services/expense.service';
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
  DollarSign,
  SlidersHorizontal,
  TrendingUp,
  Tag,
  Eye,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // ---- Expenses ----
  expenses = signal<Expense[]>([]);
  isExpensesLoading = signal(false);
  expensesError = signal('');

  // Filters (defaults matching the API example range)
  expenseDateFrom = signal('2025-06-01');
  expenseDateTo = signal('2026-12-30');
  expenseCategory = signal('');

  // Expense View Panel
  isExpenseViewOpen = signal(false);
  expenseViewData = signal<ExpenseDetailResponse | null>(null);
  isExpenseViewLoading = signal(false);
  expenseViewError = signal('');

  // Delete Expense Modal State
  isDeleteExpenseModalOpen = signal(false);
  expenseToDelete = signal<Expense | null>(null);
  isDeletingExpense = signal(false);
  deleteExpenseError = signal('');

  // Add / Edit Expense Modal — multi-step
  isAddExpenseOpen = signal(false);
  addExpenseStep = signal<1 | 2 | 3>(1);
  isEditingExpense = signal(false);
  editingExpenseRecord = signal<ExpenseDetailCore | null>(null);
  isLoadingEditExpense = signal(false);

  // Step 1: group
  selectedExpenseGroup = signal<Group | null>(null);

  // Step 2: members + per-member paid amounts
  addExpenseMembers = signal<GroupMember[]>([]);
  isLoadingAddExpenseMembers = signal(false);
  selectedMemberIds = signal<number[]>([]);
  memberPaidAmounts = signal<Record<number, string>>({});   // { memberId: 'amount string' }

  // Step 3: details
  newExpenseTitle = signal('');
  newExpenseDetails = signal('');
  newExpenseCategory = signal('');
  newExpenseDate = signal<string>(new Date().toISOString().split('T')[0]);

  isSubmittingExpense = signal(false);
  addExpenseError = signal('');

  readonly expenseCategories = ['Flat', 'Trip', 'Food', 'Utilities', 'Entertainment', 'Other'];
  readonly parseFloat = parseFloat;

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
  readonly DollarSign = DollarSign;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly TrendingUp = TrendingUp;
  readonly Tag = Tag;
  readonly Eye = Eye;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;

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
    private expenseService: ExpenseService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
    this.isMobileNavOpen.set(false);
    if (tab === 'expenses' && this.expenses().length === 0 && !this.isExpensesLoading()) {
      this.loadExpenseSummary();
    }
  }

  loadExpenseSummary() {
    const userId = this.authService.currentUserId();
    if (!userId) return;

    this.isExpensesLoading.set(true);
    this.expensesError.set('');

    this.expenseService
      .getExpenseSummary(userId, {
        category: this.expenseCategory(),
        dateFrom: this.expenseDateFrom(),
        dateTo: this.expenseDateTo(),
      })
      .subscribe({
        next: (data) => {
          this.expenses.set(Array.isArray(data) ? data : []);
          this.isExpensesLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load expense summary:', err);
          this.expensesError.set('Failed to load expenses. Please try again.');
          this.isExpensesLoading.set(false);
        },
      });
  }

  applyExpenseFilters() {
    this.expenses.set([]);
    this.loadExpenseSummary();
  }

  getExpenseDisplayName(expense: Expense): string {
    return expense.title || expense.name || expense.description || 'Untitled Expense';
  }

  getExpenseDate(expense: Expense): string {
    const raw = expense.expenseDate || expense.date || expense.createdAt;
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getExpenseTotalAmount(): number {
    return this.expenses().reduce((sum, e) => sum + (e.amount ?? 0), 0);
  }

  getUniqueCategories(): string[] {
    const cats = this.expenses()
      .map((e) => e.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)];
  }

  openAddExpenseModal() {
    this.isEditingExpense.set(false);
    this.editingExpenseRecord.set(null);
    this.addExpenseStep.set(1);
    this.selectedExpenseGroup.set(null);
    this.addExpenseMembers.set([]);
    this.selectedMemberIds.set([]);
    this.memberPaidAmounts.set({});
    this.newExpenseTitle.set('');
    this.newExpenseDetails.set('');
    this.newExpenseCategory.set('');
    this.newExpenseDate.set(new Date().toISOString().split('T')[0]);
    this.addExpenseError.set('');
    this.isAddExpenseOpen.set(true);
  }

  closeAddExpenseModal() {
    if (this.isSubmittingExpense()) return;
    this.isAddExpenseOpen.set(false);
  }

  // Step 1 → 2: select group and load its members
  selectExpenseGroup(group: Group) {
    this.selectedExpenseGroup.set(group);
  }

  goToStep2() {
    if (!this.selectedExpenseGroup()) return;
    this.addExpenseStep.set(2);
    this.addExpenseMembers.set([]);

    // Only reset selections when creating fresh; preserve pre-filled data for edit
    if (!this.isEditingExpense()) {
      this.selectedMemberIds.set([]);
      this.memberPaidAmounts.set({});
    }

    const groupId =
      this.selectedExpenseGroup()!.id != null
        ? this.selectedExpenseGroup()!.id
        : this.selectedExpenseGroup()!.groupId;
    if (groupId == null) return;

    this.isLoadingAddExpenseMembers.set(true);
    this.groupService.getGroupMembers(groupId).subscribe({
      next: (members) => {
        this.addExpenseMembers.set(members || []);
        if (!this.isEditingExpense()) {
          // Pre-select all members, default paid amount = '0'
          const ids = members
            .map((m) => m.groupMemebrId)
            .filter((id): id is number => id != null);
          this.selectedMemberIds.set(ids);
          const amounts: Record<number, string> = {};
          ids.forEach((id) => (amounts[id] = '0'));
          this.memberPaidAmounts.set(amounts);
        }
        this.isLoadingAddExpenseMembers.set(false);
      },
      error: () => {
        this.isLoadingAddExpenseMembers.set(false);
      },
    });
  }

  isMemberSelected(id: number): boolean {
    return this.selectedMemberIds().includes(id);
  }

  toggleExpenseMember(id: number) {
    const current = this.selectedMemberIds();
    if (current.includes(id)) {
      this.selectedMemberIds.set(current.filter((i) => i !== id));
      // Remove their paid amount entry
      this.memberPaidAmounts.update((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      this.selectedMemberIds.set([...current, id]);
      this.memberPaidAmounts.update((prev) => ({ ...prev, [id]: '0' }));
    }
  }

  setMemberPaidAmount(memberId: number, value: string) {
    this.memberPaidAmounts.update((prev) => ({ ...prev, [memberId]: value }));
  }

  getPaidAmountTotal(): number {
    return Object.values(this.memberPaidAmounts()).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0
    );
  }

  goToStep3() {
    if (this.selectedMemberIds().length < 1) {
      this.addExpenseError.set('Select at least one member.');
      return;
    }
    if (this.getPaidAmountTotal() <= 0) {
      this.addExpenseError.set('At least one member must have a paid amount greater than 0.');
      return;
    }
    this.addExpenseError.set('');
    this.addExpenseStep.set(3);
  }

  submitAddExpense() {
    const title = this.newExpenseTitle().trim();
    const category = this.newExpenseCategory();
    const expenseDate = this.newExpenseDate();
    const totalAmount = this.getPaidAmountTotal();

    if (!title) { this.addExpenseError.set('Title is required.'); return; }
    if (!category) { this.addExpenseError.set('Please select a category.'); return; }
    if (!expenseDate) { this.addExpenseError.set('Please select an expense date.'); return; }
    if (totalAmount <= 0) { this.addExpenseError.set('Total paid amount must be greater than 0.'); return; }

    const userId = this.authService.currentUserId();
    const profile = this.authService.userDetails();
    const actorEmail = profile?.email || 'admin';
    const group = this.selectedExpenseGroup()!;
    const groupId = group.id != null ? group.id : group.groupId;
    const now = new Date().toISOString();
    // Construct ISO string directly — avoids Date constructor locale/timezone ambiguity
    const expenseDateISO = `${expenseDate}T00:00:00.000Z`;

    const selectedMembers = this.addExpenseMembers().filter(
      (m) => m.groupMemebrId != null && this.isMemberSelected(m.groupMemebrId)
    );

    const amounts = this.memberPaidAmounts();

    const editRecord = this.editingExpenseRecord();
    const payload: CreateExpenseRequest = {
      expenseRecord: {
        id: this.isEditingExpense() ? (editRecord?.expenseId ?? null) : null,
        title,
        details: this.newExpenseDetails().trim(),
        amount: totalAmount,
        category,
        userId: userId!,
        groupId: groupId!,
        createdBy: this.isEditingExpense() ? (editRecord?.createdBy || actorEmail) : actorEmail,
        isGroup: true,
        createdAt: this.isEditingExpense() ? (editRecord?.dateCreated || now) : now,
        expenseDate: expenseDateISO,
      },
      expenseDetails: selectedMembers.map((m) => ({
        expenseDetailId: null,
        expenseId: null,
        groupMemberId: m.groupMemebrId!,
        paidAmount: parseFloat(amounts[m.groupMemebrId!]) || 0,
        pendingAmount: 0.0,
        createdBy: actorEmail,
        createdAt: now,
      })),
    };

    this.isSubmittingExpense.set(true);
    this.addExpenseError.set('');

    this.expenseService.createExpense(payload).subscribe({
      next: () => {
        this.isSubmittingExpense.set(false);
        this.closeAddExpenseModal();
        // Refresh expense list if on expenses tab
        if (this.activeTab() === 'expenses') {
          this.expenses.set([]);
          this.loadExpenseSummary();
        }
      },
      error: (err) => {
        console.error('Failed to create expense:', err);
        this.isSubmittingExpense.set(false);
        this.addExpenseError.set('Failed to add expense. Please try again.');
      },
    });
  }

  viewExpense(expense: Expense) {
    const id = expense.expenseId ?? expense.id;
    if (id == null) return;

    this.expenseViewData.set(null);
    this.expenseViewError.set('');
    this.isExpenseViewLoading.set(true);
    this.isExpenseViewOpen.set(true);

    this.expenseService.getExpenseById(id).subscribe({
      next: (data) => {
        this.expenseViewData.set(data);
        this.isExpenseViewLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load expense detail:', err);
        this.expenseViewError.set('Failed to load expense details.');
        this.isExpenseViewLoading.set(false);
      },
    });
  }

  closeExpenseView() {
    this.isExpenseViewOpen.set(false);
  }

  // Returns the member who paid (amountToPay is null = they initiated/paid)
  getExpensePayer(detail: ExpenseDetailResponse): ExpenseMemberDetail | null {
    return detail.expenseDetails.find((m) => m.amountToPay === null) ?? null;
  }

  // Returns members who owe money
  getExpenseOwers(detail: ExpenseDetailResponse): ExpenseMemberDetail[] {
    return detail.expenseDetails.filter((m) => m.amountToPay !== null);
  }

  // 0–100 settlement progress for an ower
  getMemberSettlementProgress(member: ExpenseMemberDetail): number {
    if (member.isSettled) return 100;
    if (member.amountToPay == null) return 100; // payer = fully contributed
    const total = Math.abs(member.amountToPay);
    const pending = Math.abs(member.pendingAmount);
    if (total === 0) return 100;
    return Math.round(((total - pending) / total) * 100);
  }

  formatDetailDate(raw?: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  }

  editExpense(expense: Expense) {
    const id = expense.expenseId ?? expense.id;
    if (id == null) return;

    this.isEditingExpense.set(true);
    this.editingExpenseRecord.set(null);
    this.addExpenseStep.set(1);
    this.addExpenseMembers.set([]);
    this.selectedMemberIds.set([]);
    this.memberPaidAmounts.set({});
    this.newExpenseTitle.set('');
    this.newExpenseDetails.set('');
    this.newExpenseCategory.set('');
    this.newExpenseDate.set(new Date().toISOString().split('T')[0]);
    this.addExpenseError.set('');
    this.isLoadingEditExpense.set(true);
    this.isAddExpenseOpen.set(true);

    this.expenseService.getExpenseById(id).subscribe({
      next: (detail) => {
        const core = detail.expense;
        this.editingExpenseRecord.set(core);

        // Pre-fill step 3 fields
        this.newExpenseTitle.set(core.title || '');
        this.newExpenseDetails.set(core.details || '');
        this.newExpenseCategory.set(core.category || '');
        const rawDate = core.expenseDate || core.dateCreated;
        this.newExpenseDate.set(
          rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0],
        );

        // Pre-fill member paid amounts — preserved when goToStep2() runs in edit mode
        const ids: number[] = [];
        const amounts: Record<number, string> = {};
        detail.expenseDetails.forEach((m) => {
          ids.push(m.groupMemberId);
          amounts[m.groupMemberId] = String(m.paidAmount);
        });
        this.selectedMemberIds.set(ids);
        this.memberPaidAmounts.set(amounts);

        // Match and set the group, then jump straight to step 2
        const groupId = expense.groupId;
        const matchedGroup =
          this.groups().find((g) => (g.id != null ? g.id : g.groupId) == groupId) ?? null;
        this.selectedExpenseGroup.set(matchedGroup);

        // Clear the edit-loading overlay before goToStep2 sets its own member-loading state
        this.isLoadingEditExpense.set(false);
        // Automatically advance to step 2 — group is already known, no need to re-select
        this.goToStep2();
      },
      error: (err) => {
        console.error('Failed to load expense for editing:', err);
        this.isLoadingEditExpense.set(false);
        this.isAddExpenseOpen.set(false);
      },
    });
  }

  deleteExpense(expense: Expense) {
    this.expenseToDelete.set(expense);
    this.deleteExpenseError.set('');
    this.isDeleteExpenseModalOpen.set(true);
  }

  closeDeleteExpenseModal() {
    if (this.isDeletingExpense()) return;
    this.isDeleteExpenseModalOpen.set(false);
    this.expenseToDelete.set(null);
  }

  getExpenseToDeleteName(): string {
    const e = this.expenseToDelete();
    return e ? this.getExpenseDisplayName(e) : 'this expense';
  }

  confirmDeleteExpense() {
    const expense = this.expenseToDelete();
    if (!expense) return;

    const expenseId = expense.expenseId ?? expense.id;
    if (expenseId == null) {
      this.deleteExpenseError.set('Could not identify the expense to delete.');
      return;
    }

    this.isDeletingExpense.set(true);
    this.deleteExpenseError.set('');

    this.expenseService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.isDeletingExpense.set(false);
        this.closeDeleteExpenseModal();
        this.expenses.set([]);
        this.loadExpenseSummary();
      },
      error: (err) => {
        console.error('Failed to delete expense:', err);
        this.isDeletingExpense.set(false);
        this.deleteExpenseError.set('Failed to delete expense. Please try again.');
      },
    });
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
