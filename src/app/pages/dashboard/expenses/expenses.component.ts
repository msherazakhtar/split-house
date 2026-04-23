import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, Group, GroupMember } from '../../../services/group.service';
import {
  ExpenseService,
  Expense,
  ExpenseDetailCore,
  ExpenseDetailResponse,
  ExpenseMemberDetail,
  CreateExpenseRequest,
} from '../../../services/expense.service';
import { SettlementService, CreateSettlementPayload } from '../../../services/settlement.service';
import { AuthService } from '../../../services/auth.service';
import {
  LucideAngularModule,
  Receipt,
  Plus,
  SlidersHorizontal,
  DollarSign,
  Tag,
  Eye,
  Trash2,
  TriangleAlert,
  X,
  Users,
  House,
  Handshake,
} from 'lucide-angular';

@Component({
  selector: 'app-expenses',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css',
})
export class ExpensesComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  isExpensesLoading = signal(false);
  expensesError = signal('');

  // Filters
  expenseDateFrom = signal('2025-06-01');
  expenseDateTo = signal('2026-12-30');
  expenseCategory = signal('');

  // Pagination
  expensePageNumber = signal(1);
  expensePageSize = signal(10);
  expenseTotalPages = signal(1);

  // Expense View Panel
  isExpenseViewOpen = signal(false);
  expenseViewData = signal<ExpenseDetailResponse | null>(null);
  isExpenseViewLoading = signal(false);
  expenseViewError = signal('');

  // Delete Expense Modal
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
  groups = signal<Group[]>([]);
  selectedExpenseGroup = signal<Group | null>(null);

  // Step 2: members + per-member paid amounts
  addExpenseMembers = signal<GroupMember[]>([]);
  isLoadingAddExpenseMembers = signal(false);
  selectedMemberIds = signal<number[]>([]);
  memberPaidAmounts = signal<Record<number, string>>({});

  // Step 3: details
  newExpenseTitle = signal('');
  newExpenseDetails = signal('');
  newExpenseCategory = signal('');
  newExpenseDate = signal<string>(new Date().toISOString().split('T')[0]);

  isSubmittingExpense = signal(false);
  addExpenseError = signal('');

  // Settle Member Modal
  isSettleModalOpen = signal(false);
  settleMember = signal<ExpenseMemberDetail | null>(null);
  settleExpenseDetail = signal<ExpenseDetailResponse | null>(null);
  settleReceiver = signal<ExpenseMemberDetail | null>(null);
  settleDate = signal<string>(new Date().toISOString().split('T')[0]);
  settleAmount = signal<string>('');
  isSubmittingSettle = signal(false);
  settleError = signal('');

  readonly expenseCategories = ['Flat', 'Trip', 'Food', 'Utilities', 'Entertainment', 'Other'];
  readonly parseFloat = parseFloat;

  readonly Receipt = Receipt;
  readonly Plus = Plus;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly DollarSign = DollarSign;
  readonly Tag = Tag;
  readonly Eye = Eye;
  readonly Trash2 = Trash2;
  readonly TriangleAlert = TriangleAlert;
  readonly X = X;
  readonly Users = Users;
  readonly House = House;
  readonly Handshake = Handshake;

  constructor(
    private expenseService: ExpenseService,
    private groupService: GroupService,
    private settlementService: SettlementService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadExpenseSummary();
    this.loadGroups();
  }

  private loadGroups(): void {
    const userId = this.authService.currentUserId();
    if (!userId) return;
    this.groupService.getGroupsByUser(userId).subscribe({
      next: (data) => this.groups.set(data || []),
      error: (err) => console.error('Failed to load groups for expenses:', err),
    });
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
        pageNumber: this.expensePageNumber(),
        pageSize: this.expensePageSize(),
      })
      .subscribe({
        next: (data) => {
          const list = Array.isArray(data) ? data : [];
          this.expenses.set(list);
          const total = list.length > 0 ? parseInt(list[0].totalPages ?? '1', 10) : 1;
          this.expenseTotalPages.set(isNaN(total) || total < 1 ? 1 : total);
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
    this.expensePageNumber.set(1);
    this.loadExpenseSummary();
  }

  goToExpensePage(page: number) {
    const total = this.expenseTotalPages();
    if (page < 1 || page > total) return;
    this.expensePageNumber.set(page);
    this.loadExpenseSummary();
  }

  onExpensePageSizeChange() {
    this.expensePageNumber.set(1);
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

  selectExpenseGroup(group: Group) {
    this.selectedExpenseGroup.set(group);
  }

  goToStep2() {
    if (!this.selectedExpenseGroup()) return;
    this.addExpenseStep.set(2);
    this.addExpenseMembers.set([]);

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
      0,
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
    const expenseDateISO = `${expenseDate}T00:00:00.000Z`;

    const selectedMembers = this.addExpenseMembers().filter(
      (m) => m.groupMemebrId != null && this.isMemberSelected(m.groupMemebrId),
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
        this.expenses.set([]);
        this.loadExpenseSummary();
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

  getExpensePayers(detail: ExpenseDetailResponse): ExpenseMemberDetail[] {
    return detail.expenseDetails.filter((m) => m.amountToPay === null);
  }

  getExpensePayer(detail: ExpenseDetailResponse): ExpenseMemberDetail | null {
    const payers = this.getExpensePayers(detail);
    if (payers.length === 0) return null;
    return payers.reduce((top, m) => (m.paidAmount > top.paidAmount ? m : top));
  }

  getPayerLabel(payer: ExpenseMemberDetail, allPayers: ExpenseMemberDetail[], totalAmount: number): string {
    if (payer.paidAmount >= totalAmount) return 'Paid full amount';
    if (allPayers.length === 1) return 'Paid most';
    const maxPaid = Math.max(...allPayers.map((p) => p.paidAmount));
    return payer.paidAmount === maxPaid ? 'Paid most' : 'Also paid';
  }

  getExpenseOwers(detail: ExpenseDetailResponse): ExpenseMemberDetail[] {
    return detail.expenseDetails.filter((m) => m.amountToPay !== null);
  }

  getMemberSettlementProgress(member: ExpenseMemberDetail): number {
    if (member.isSettled) return 100;
    if (member.amountToPay == null) return 100;
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

  getMemberInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
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
        this.newExpenseTitle.set(core.title || '');
        this.newExpenseDetails.set(core.details || '');
        this.newExpenseCategory.set(core.category || '');
        const rawDate = core.expenseDate || core.dateCreated;
        this.newExpenseDate.set(
          rawDate ? rawDate.split('T')[0] : new Date().toISOString().split('T')[0],
        );

        const ids: number[] = [];
        const amounts: Record<number, string> = {};
        detail.expenseDetails.forEach((m) => {
          ids.push(m.groupMemberId);
          amounts[m.groupMemberId] = String(m.paidAmount);
        });
        this.selectedMemberIds.set(ids);
        this.memberPaidAmounts.set(amounts);

        const groupId = expense.groupId;
        const matchedGroup =
          this.groups().find((g) => (g.id != null ? g.id : g.groupId) == groupId) ?? null;
        this.selectedExpenseGroup.set(matchedGroup);
        this.isLoadingEditExpense.set(false);
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

  openSettleModal(member: ExpenseMemberDetail, detail: ExpenseDetailResponse) {
    this.settleMember.set(member);
    this.settleExpenseDetail.set(detail);
    this.settleDate.set(new Date().toISOString().split('T')[0]);
    this.settleError.set('');
    this.settleAmount.set('');

    const payers = this.getExpensePayers(detail);
    const autoReceiver = payers.length === 1 ? payers[0] : null;
    this.settleReceiver.set(autoReceiver);
    if (autoReceiver) {
      this.settleAmount.set(String(this.getSettleMaxAmount(member, autoReceiver)));
    }

    this.isSettleModalOpen.set(true);
  }

  selectSettleReceiver(receiver: ExpenseMemberDetail) {
    this.settleReceiver.set(receiver);
    this.settleError.set('');
    const member = this.settleMember();
    if (member) {
      this.settleAmount.set(String(this.getSettleMaxAmount(member, receiver)));
    }
  }

  getSettleMaxAmount(member: ExpenseMemberDetail, receiver: ExpenseMemberDetail): number {
    const owedByMember = Math.abs(member.pendingAmount ?? member.amountToPay ?? 0);
    const owedToReceiver = receiver.amountToGet ?? 0;
    return Math.min(owedByMember, owedToReceiver);
  }

  clampSettleAmount() {
    const val = parseFloat(this.settleAmount());
    const member = this.settleMember();
    const receiver = this.settleReceiver();
    if (!member || !receiver || isNaN(val)) return;
    const max = this.getSettleMaxAmount(member, receiver);
    if (val > max) this.settleAmount.set(String(max));
    if (val < 0) this.settleAmount.set('0');
  }

  closeSettleModal() {
    if (this.isSubmittingSettle()) return;
    this.isSettleModalOpen.set(false);
    this.settleMember.set(null);
    this.settleExpenseDetail.set(null);
    this.settleReceiver.set(null);
  }

  confirmSettle() {
    const member = this.settleMember();
    const detail = this.settleExpenseDetail();
    if (!member || !detail) return;

    const receiver = this.settleReceiver();
    if (!receiver) {
      this.settleError.set('Please select who you are paying.');
      return;
    }

    const amount = parseFloat(this.settleAmount());
    const maxAmount = this.getSettleMaxAmount(member, receiver);

    if (!amount || amount <= 0) {
      this.settleError.set('Settlement amount must be greater than 0.');
      return;
    }
    if (amount > maxAmount) {
      this.settleError.set(`Amount cannot exceed PKR ${maxAmount.toLocaleString()}.`);
      return;
    }
    if (!this.settleDate()) {
      this.settleError.set('Please select a settlement date.');
      return;
    }

    const payload: CreateSettlementPayload = {
      expenseSettlementId: null,
      expenseId: detail.expense.expenseId,
      payerExpenseDetailsId: member.expenseDetailsId,
      receiverExpenseDetailsId: receiver.expenseDetailsId,
      settlementAmount: amount,
      settlementType: 'Paid',
      paidBy: member.groupMemberId,
      paidTo: receiver.groupMemberId,
      settlementDate: this.settleDate(),
    };

    this.isSubmittingSettle.set(true);
    this.settleError.set('');

    this.settlementService.createSettlement(payload).subscribe({
      next: () => {
        this.isSubmittingSettle.set(false);
        this.closeSettleModal();
        this.viewExpense({ expenseId: detail.expense.expenseId } as any);
      },
      error: (err) => {
        console.error('Failed to record settlement:', err);
        this.isSubmittingSettle.set(false);
        this.settleError.set('Failed to record settlement. Please try again.');
      },
    });
  }
}
