import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_LOGOUT } from './auth.interceptor';

export interface ExpenseSummaryParams {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseSummaryRequest {
  id: number | string;
  parameters: Array<{ paramName: string; paramValue: string }>;
}

export interface Expense {
  id?: number;
  expenseId?: number;
  title?: string;
  name?: string;
  description?: string;
  amount?: number;
  category?: string;
  date?: string;
  expenseDate?: string;
  groupId?: number | string;
  groupName?: string;
  paidBy?: string;
  splitType?: string;
  createdAt?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface ExpenseDetailCore {
  expenseId: number;
  title: string;
  details?: string;
  createdBy?: string;
  totalAmount: number;
  amountPerHead: number;
  groupName?: string;
  category?: string;
  expenseDate?: string;
  dateCreated?: string;
}

export interface ExpenseMemberDetail {
  expenseDetailsId: number;
  expenseId: number;
  groupMemberId: number;
  groupMemberName: string;
  paidAmount: number;
  amountToPay: number | null;
  amountToGet: number | null;
  pendingAmount: number;
  isSettled: boolean;
}

export interface ExpenseDetailResponse {
  expense: ExpenseDetailCore;
  expenseDetails: ExpenseMemberDetail[];
}

export interface CreateExpenseDetail {
  expenseDetailId: number | null;
  expenseId: number | null;
  groupMemberId: number;
  paidAmount: number;
  pendingAmount: number;
  createdBy: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  expenseRecord: {
    id: number | null;
    title: string;
    details: string;
    amount: number;
    category: string;
    userId: number | string;
    groupId: number | string;
    createdBy: string;
    isGroup: boolean;
    createdAt: string;
    expenseDate: string;
  };
  expenseDetails: CreateExpenseDetail[];
}

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private baseUrl = `${environment.apiUrl}/expense`;

  constructor(private http: HttpClient) {}

  createExpense(payload: CreateExpenseRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, payload);
  }

  getExpenseById(expenseId: number): Observable<ExpenseDetailResponse> {
    return this.http.get<ExpenseDetailResponse>(`${this.baseUrl}/${expenseId}`);
  }

  deleteExpense(expenseId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${expenseId}`);
  }

  getExpenseSummary(userId: number | string, params: ExpenseSummaryParams = {}): Observable<Expense[]> {
    const body: ExpenseSummaryRequest = {
      id: userId,
      parameters: [
        { paramName: 'category', paramValue: params.category ?? '' },
        { paramName: 'dateFrom', paramValue: params.dateFrom ?? '' },
        { paramName: 'dateTo', paramValue: params.dateTo ?? '' },
      ],
    };
    return this.http.post<Expense[]>(`${this.baseUrl}/summary`, body);
  }

  syncExpenses(): Observable<void> {
    return this.http.get<void>(`${environment.apiUrl}/expense/sync`, {
      context: new HttpContext().set(SKIP_AUTH_LOGOUT, true),
    });
  }
}
