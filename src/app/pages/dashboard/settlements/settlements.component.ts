import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettlementService, SettlementSummary } from '../../../services/settlement.service';
import { AuthService } from '../../../services/auth.service';
import {
  LucideAngularModule,
  Handshake,
  DollarSign,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  TriangleAlert,
  LayoutList,
  Users,
  ArrowRight,
} from 'lucide-angular';

@Component({
  selector: 'app-settlements',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settlements.component.html',
  styleUrl: './settlements.component.css',
})
export class SettlementsComponent implements OnInit {
  settlements = signal<SettlementSummary[]>([]);
  isSettlementsLoading = signal(false);
  settlementsError = signal('');

  // Filters
  settlementDateFrom = signal('2025-06-01');
  settlementDateTo = signal('2026-12-30');
  settlementGroupFilter = '';
  settlementView = signal<'list' | 'byPerson'>('list');

  username = signal<string>('User');

  readonly Handshake = Handshake;
  readonly DollarSign = DollarSign;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly TriangleAlert = TriangleAlert;
  readonly LayoutList = LayoutList;
  readonly Users = Users;
  readonly ArrowRight = ArrowRight;

  constructor(
    private settlementService: SettlementService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.deriveUsername();
    this.loadSettlementSummary();
  }

  private deriveUsername(): void {
    const profile = this.authService.userDetails();
    const userData = this.authService.currentUserData();
    const fullName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
      : '';
    this.username.set(
      fullName || profile?.name || profile?.username || userData?.name || userData?.username || 'User',
    );
  }

  loadSettlementSummary() {
    const userId = this.authService.currentUserId();
    if (!userId) return;

    this.isSettlementsLoading.set(true);
    this.settlementsError.set('');

    this.settlementService
      .getSettlementSummary(userId, {
        dateFrom: this.settlementDateFrom(),
        dateTo: this.settlementDateTo(),
      })
      .subscribe({
        next: (data) => {
          this.settlements.set(Array.isArray(data) ? data : []);
          this.isSettlementsLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load settlement summary:', err);
          this.settlementsError.set('Failed to load settlements. Please try again.');
          this.isSettlementsLoading.set(false);
        },
      });
  }

  applySettlementFilters() {
    this.settlements.set([]);
    this.loadSettlementSummary();
  }

  getSettlementDate(settlement: SettlementSummary): string {
    if (!settlement.settlementDate) return '';
    const d = new Date(settlement.settlementDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getSettlementsTotalAmount(): number {
    return this.settlements().reduce((sum, s) => sum + Math.abs(s.settlementAmount ?? 0), 0);
  }

  getSettlementsUniqueGroups(): string[] {
    const groups = this.settlements()
      .map((s) => s.groupName)
      .filter((g): g is string => !!g);
    return [...new Set(groups)];
  }

  getFilteredSettlements(): SettlementSummary[] {
    const group = this.settlementGroupFilter;
    if (!group) return this.settlements();
    return this.settlements().filter((s) => s.groupName === group);
  }

  getSettlementsYouAreOwed(): number {
    return this.getFilteredSettlements()
      .filter((s) => s.paidTo === this.username())
      .reduce((sum, s) => sum + Math.abs(s.settlementAmount ?? 0), 0);
  }

  getSettlementsYouOwe(): number {
    return this.getFilteredSettlements()
      .filter((s) => s.paidBy === this.username())
      .reduce((sum, s) => sum + Math.abs(s.settlementAmount ?? 0), 0);
  }

  getPersonPairSummary(): { paidBy: string; paidTo: string; total: number; count: number }[] {
    const map = new Map<string, { paidBy: string; paidTo: string; total: number; count: number }>();
    for (const s of this.getFilteredSettlements()) {
      const key = `${s.paidBy}→${s.paidTo}`;
      if (!map.has(key)) map.set(key, { paidBy: s.paidBy, paidTo: s.paidTo, total: 0, count: 0 });
      const entry = map.get(key)!;
      entry.total += Math.abs(s.settlementAmount ?? 0);
      entry.count++;
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }

  getAvatarInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#e8d5b7', '#b7d5e8', '#b7e8d5', '#d5b7e8', '#e8b7d5', '#d5e8b7'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  isCurrentUser(name: string): boolean {
    return name === this.username();
  }
}
