import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SettlementSummary {
  expenseSettlementId: number;
  settlementDate: string;
  paidBy: string;
  paidTo: string;
  groupName: string;
  settlementAmount: number;
  expenseTitle?: string;
}

export interface SettlementSummaryParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateSettlementPayload {
  expenseSettlementId: null;
  expenseId: number;
  payerExpenseDetailsId: number;
  receiverExpenseDetailsId: number;
  settlementAmount: number;
  settlementType: 'Paid';
  paidBy: number;
  paidTo: number;
  settlementDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettlementService {
  private baseUrl = `${environment.apiUrl}/settlement`;

  constructor(private http: HttpClient) {}

  createSettlement(payload: CreateSettlementPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/paid`, payload);
  }

  getSettlementSummary(
    userId: number | string,
    params: SettlementSummaryParams = {},
  ): Observable<SettlementSummary[]> {
    const body = {
      id: userId,
      parameters: [
        { paramName: 'category', paramValue: '' },
        { paramName: 'dateFrom', paramValue: params.dateFrom ?? '' },
        { paramName: 'dateTo', paramValue: params.dateTo ?? '' },
      ],
    };
    return this.http.post<SettlementSummary[]>(`${this.baseUrl}/summary`, body);
  }
}
