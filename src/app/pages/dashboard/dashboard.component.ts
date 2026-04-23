import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  House,
  Receipt,
  Handshake,
  Settings,
  Menu,
  X,
  BarChart2,
  Construction,
} from 'lucide-angular';
import { GroupsComponent } from './groups/groups.component';
import { ExpensesComponent } from './expenses/expenses.component';
import { SettlementsComponent } from './settlements/settlements.component';
import { ReportsComponent } from './reports/reports.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    LucideAngularModule,
    GroupsComponent,
    ExpensesComponent,
    SettlementsComponent,
    ReportsComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  isMobileNavOpen = signal(false);
  username = signal<string>('User');
  activeTab = signal<string>('groups');

  readonly House = House;
  readonly Receipt = Receipt;
  readonly Handshake = Handshake;
  readonly Settings = Settings;
  readonly Menu = Menu;
  readonly X = X;
  readonly BarChart2 = BarChart2;
  readonly Construction = Construction;

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUsername();
    this.startSyncJob();
  }

  ngOnDestroy(): void {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  private loadUsername(): void {
    const userId = this.authService.currentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    const userData = this.authService.currentUserData();
    const profile = this.authService.userDetails();
    const fullName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
      : '';
    this.username.set(
      fullName ||
        profile?.name ||
        profile?.username ||
        userData?.name ||
        userData?.username ||
        'User',
    );
  }

  private startSyncJob(): void {
    this.callSync();
    this.syncInterval = setInterval(() => this.callSync(), 10 * 60 * 1000);
  }

  private callSync(): void {
    this.expenseService
      .syncExpenses()
      .subscribe({ error: (e: unknown) => console.error('Sync failed', e) });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    this.isMobileNavOpen.set(false);
  }

  toggleMobileNav(): void {
    this.isMobileNavOpen.update((v) => !v);
  }

  logout(): void {
    this.isMobileNavOpen.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
