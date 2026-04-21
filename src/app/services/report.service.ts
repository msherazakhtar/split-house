import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MonthlyReportResult {
  group_id: number;
  group_name: string;
  total_expense: number;
  total_members: number;
}

export interface MonthlyReportParams {
  userId: number;
  groupId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseDetailRow {
  expense_id: number;
  title: string;
  category: string;
  expense_date: string;
  total_amount: number;
  amount_per_head: number;
  member_name: string;
  is_settled: boolean;
}

export interface MemberSplitDetail {
  member_name: string;
  email: string;
  total_to_receive: number;
  total_to_pay: number;
  total_pending: number;
  net_balance: number;
  final_comments: string;
}

export interface MonthlyReportDetailsResponse {
  lstExpensesDetails: ExpenseDetailRow[];
  lstExpenseSplitDetails: MemberSplitDetail[];
}

export interface GroupedExpense {
  expense_id: number;
  title: string;
  category: string;
  expense_date: string;
  total_amount: number;
  amount_per_head: number;
  members: { name: string; is_settled: boolean }[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildPayload(params: MonthlyReportParams) {
    const parameters: { paramName: string; paramValue: string }[] = [];
    if (params.groupId) parameters.push({ paramName: 'groupId', paramValue: params.groupId });
    if (params.dateFrom) parameters.push({ paramName: 'dateFrom', paramValue: params.dateFrom });
    if (params.dateTo) parameters.push({ paramName: 'dateTo', paramValue: params.dateTo });
    return { id: params.userId, parameters };
  }

  getMonthlyReport(params: MonthlyReportParams): Observable<MonthlyReportResult[]> {
    return this.http.post<MonthlyReportResult[]>(
      `${this.apiUrl}/reports/monthly`,
      this.buildPayload(params),
    );
  }

  getMonthlyReportDetails(params: MonthlyReportParams): Observable<MonthlyReportDetailsResponse> {
    return this.http.post<MonthlyReportDetailsResponse>(
      `${this.apiUrl}/reports/monthly/details`,
      this.buildPayload(params),
    );
  }

  groupExpenseDetails(rows: ExpenseDetailRow[]): GroupedExpense[] {
    const map = new Map<number, GroupedExpense>();
    for (const row of rows) {
      if (!map.has(row.expense_id)) {
        map.set(row.expense_id, {
          expense_id: row.expense_id,
          title: row.title,
          category: row.category,
          expense_date: row.expense_date,
          total_amount: row.total_amount,
          amount_per_head: row.amount_per_head,
          members: [],
        });
      }
      map.get(row.expense_id)!.members.push({ name: row.member_name, is_settled: row.is_settled });
    }
    return [...map.values()];
  }
}
