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
  groupId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMonthlyReport(params: MonthlyReportParams): Observable<MonthlyReportResult[]> {
    const parameters: { paramName: string; paramValue: string }[] = [];
    if (params.groupId) parameters.push({ paramName: 'groupId', paramValue: params.groupId });
    if (params.dateFrom) parameters.push({ paramName: 'dateFrom', paramValue: params.dateFrom });
    if (params.dateTo) parameters.push({ paramName: 'dateTo', paramValue: params.dateTo });

    return this.http.post<MonthlyReportResult[]>(`${this.apiUrl}/reports/monthly`, {
      id: 1,
      parameters,
    });
  }
}
