import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupService, Group } from '../../../services/group.service';
import {
  ReportService,
  MonthlyReportResult,
  MonthlyReportDetailsResponse,
  GroupedExpense,
} from '../../../services/report.service';
import { AuthService } from '../../../services/auth.service';
import {
  LucideAngularModule,
  BarChart2,
  DollarSign,
  Users,
  Eye,
  TriangleAlert,
  X,
  Check,
} from 'lucide-angular';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  reportSubTab = signal<'monthly'>('monthly');
  monthlyReportResults = signal<MonthlyReportResult[]>([]);
  isReportLoading = signal(false);
  reportError = signal('');
  reportGroupId = signal('-1');
  reportDateFrom = signal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  );
  reportDateTo = signal(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  );

  // Report detail panel
  isReportDetailOpen = signal(false);
  reportDetailRow = signal<MonthlyReportResult | null>(null);
  reportDetailData = signal<MonthlyReportDetailsResponse | null>(null);
  reportDetailGrouped = signal<GroupedExpense[]>([]);
  isReportDetailLoading = signal(false);
  reportDetailError = signal('');

  groups = signal<Group[]>([]);

  readonly BarChart2 = BarChart2;
  readonly DollarSign = DollarSign;
  readonly Users = Users;
  readonly Eye = Eye;
  readonly TriangleAlert = TriangleAlert;
  readonly X = X;
  readonly Check = Check;

  constructor(
    private reportService: ReportService,
    private groupService: GroupService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  private loadGroups(): void {
    const userId = this.authService.currentUserId();
    if (!userId) return;
    this.groupService.getGroupsByUser(userId).subscribe({
      next: (data) => this.groups.set(data || []),
      error: (err) => console.error('Failed to load groups for reports:', err),
    });
  }

  loadMonthlyReport() {
    this.isReportLoading.set(true);
    this.reportError.set('');
    this.monthlyReportResults.set([]);

    const gid = this.reportGroupId();
    const userId = this.authService.currentUserId();
    this.reportService
      .getMonthlyReport({
        userId: Number(userId),
        groupId: gid === '-1' ? '-1' : gid,
        dateFrom: this.reportDateFrom() || undefined,
        dateTo: this.reportDateTo() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.monthlyReportResults.set(Array.isArray(data) ? data : []);
          this.isReportLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load monthly report:', err);
          this.reportError.set('Failed to load report. Please try again.');
          this.isReportLoading.set(false);
        },
      });
  }

  openReportDetail(row: MonthlyReportResult): void {
    this.reportDetailRow.set(row);
    this.reportDetailData.set(null);
    this.reportDetailGrouped.set([]);
    this.reportDetailError.set('');
    this.isReportDetailLoading.set(true);
    this.isReportDetailOpen.set(true);

    const userId = this.authService.currentUserId();
    this.reportService
      .getMonthlyReportDetails({
        userId: Number(userId),
        groupId: String(row.group_id),
        dateFrom: this.reportDateFrom() || undefined,
        dateTo: this.reportDateTo() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.reportDetailData.set(data);
          this.reportDetailGrouped.set(this.reportService.groupExpenseDetails(data.lstExpensesDetails));
          this.isReportDetailLoading.set(false);
        },
        error: (e: unknown) => {
          console.error('Failed to load report details', e);
          this.reportDetailError.set('Failed to load details. Please try again.');
          this.isReportDetailLoading.set(false);
        },
      });
  }

  closeReportDetail(): void {
    this.isReportDetailOpen.set(false);
    this.reportDetailRow.set(null);
  }

  formatReportDate(raw: string): string {
    if (!raw) return '';
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
