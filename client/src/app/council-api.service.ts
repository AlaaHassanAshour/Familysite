import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CouncilDashboard {
  members: number;
  councilMembersCount: number;
  branches: number;
  committees: number;
  activities: number;
  decisions: number;
  albums: number;
  upcomingEvents: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  upcomingActivities: any[];
  activeCommittees: any[];
}

export interface MemberDto {
  id: number;
  fullName: string;
  nationalId?: string;
  photoUrl?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  status: string;
  gender: string;
  isCouncilMember: boolean;
  councilRole: string;
  branchId: number;
  branch: string;
  fatherId?: number;
  fatherName?: string;
  childrenCount?: number;
}

export interface CommitteeDto {
  id: number;
  name: string;
  description?: string;
  chairpersonId: number;
  chairperson: string;
  chairpersonPhoto?: string;
  members: number;
  activities: number;
}

export interface CommitteeDetailsDto {
  id: number;
  name: string;
  description?: string;
  chairperson: {
    id: number;
    fullName: string;
    photoUrl?: string;
    phone?: string;
    role?: string;
  };
  members: Array<{
    id: number;
    fullName: string;
    councilRole: string;
    photoUrl?: string;
    phone?: string;
  }>;
  activities: Array<{
    id: number;
    title: string;
    description?: string;
    scheduledAt: string;
    status: string;
    location?: string;
  }>;
}

export interface ActivityDto {
  id: number;
  title: string;
  description?: string;
  scheduledAt: string;
  status: string;
  location?: string;
  imageUrl?: string;
  committeeId: number;
  committeeName?: string;
}

export interface UpcomingEventDto {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  eventType: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface DecisionDto {
  id: number;
  title: string;
  details?: string;
  decisionDate: string;
  referenceNumber?: string;
  status: string;
  attachmentUrl?: string;
  createdAt?: string;
}

export interface MediaAlbumDto {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  eventDate?: string;
  createdAt?: string;
  totalItems?: number;
  photoCount?: number;
  videoCount?: number;
  sampleThumbnails?: string[];
  items?: MediaItemDto[];
}

export interface MediaItemDto {
  id: number;
  albumId: number;
  filePath: string;
  mediaType: 'Photo' | 'Video';
  title?: string;
  caption?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface FinancialSummaryDto {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  totalRecords: number;
  categoryBreakdown: Array<{
    category: string;
    recordType: string;
    total: number;
    count: number;
  }>;
  recentTransactions: FinancialRecordDto[];
}

export interface FinancialRecordDto {
  id: number;
  recordType: 'Income' | 'Expense';
  category: string;
  amount: number;
  transactionDate: string;
  voucherNumber?: string;
  partyName?: string;
  description: string;
  attachmentUrl?: string;
  createdAt?: string;
}

export interface SiteSettingsDto {
  id?: number;
  familyName: string;
  councilName: string;
  logoPath?: string;
  coverImagePath?: string;
  welcomeMessage?: string;
  heroSubtitle?: string;
  visionText?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface AppUserDto {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CouncilApiService {
  private readonly http = inject(HttpClient);
  public readonly baseUrl = 'http://localhost:5104';

  // Helper to get full asset URL (for uploads)
  getMediaUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${this.baseUrl}${cleanPath}`;
  }

  // Dashboard
  getDashboard(): Observable<CouncilDashboard> {
    return this.http.get<CouncilDashboard>(`${this.baseUrl}/api/council/dashboard`);
  }

  // Auth & Users
  login(payload: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, payload);
  }

  getUsers(): Observable<AppUserDto[]> {
    return this.http.get<AppUserDto[]>(`${this.baseUrl}/api/auth/users`);
  }

  createUser(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/users`, payload);
  }

  updateUser(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/auth/users/${id}`, payload);
  }

  resetPassword(id: number, newPassword: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/auth/users/${id}/password`, { newPassword });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/auth/users/${id}`);
  }

  // Uploads
  uploadSingle(file: File, folder = 'general'): Observable<{ url: string; fileName: string; fileSize: number; mediaType: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number; mediaType: string }>(
      `${this.baseUrl}/api/upload/single?folder=${folder}`,
      formData
    );
  }

  uploadMultiple(files: File[], folder = 'albums'): Observable<Array<{ url: string; fileName: string; fileSize: number; mediaType: string }>> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<Array<{ url: string; fileName: string; fileSize: number; mediaType: string }>>(
      `${this.baseUrl}/api/upload/multiple?folder=${folder}`,
      formData
    );
  }

  // Members & Family Tree
  getMembers(paramsObj?: { branchId?: number; status?: string; fatherId?: number; isCouncilOnly?: boolean; search?: string }): Observable<MemberDto[]> {
    let params = new HttpParams();
    if (paramsObj?.branchId) params = params.set('branchId', paramsObj.branchId.toString());
    if (paramsObj?.status && paramsObj.status !== 'all') params = params.set('status', paramsObj.status);
    if (paramsObj?.fatherId) params = params.set('fatherId', paramsObj.fatherId.toString());
    if (paramsObj?.isCouncilOnly !== undefined) params = params.set('isCouncilOnly', paramsObj.isCouncilOnly.toString());
    if (paramsObj?.search) params = params.set('search', paramsObj.search);
    return this.http.get<MemberDto[]>(`${this.baseUrl}/api/council/members`, { params });
  }

  addMember(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/council/members`, payload);
  }

  updateMember(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/council/members/${id}`, payload);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/council/members/${id}`);
  }

  getFamilyTree(branchId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId.toString());
    return this.http.get<any[]>(`${this.baseUrl}/api/council/tree`, { params });
  }

  // Committees
  getCommittees(): Observable<CommitteeDto[]> {
    return this.http.get<CommitteeDto[]>(`${this.baseUrl}/api/council/committees`);
  }

  getCommittee(id: number): Observable<CommitteeDetailsDto> {
    return this.http.get<CommitteeDetailsDto>(`${this.baseUrl}/api/council/committees/${id}`);
  }

  addCommittee(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/council/committees`, payload);
  }

  updateCommittee(id: number, payload: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/api/council/committees/${id}`, payload);
  }

  deleteCommittee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/council/committees/${id}`);
  }

  // Activities
  getActivities(limit?: number): Observable<ActivityDto[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<ActivityDto[]>(`${this.baseUrl}/api/council/activities`, { params });
  }

  addActivity(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/council/activities`, payload);
  }

  updateActivity(id: number, payload: any): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/api/council/activities/${id}`, payload);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/council/activities/${id}`);
  }

  // Upcoming Events
  getUpcomingEvents(activeOnly = true): Observable<UpcomingEventDto[]> {
    return this.http.get<UpcomingEventDto[]>(`${this.baseUrl}/api/upcoming-events?activeOnly=${activeOnly}`);
  }

  addUpcomingEvent(payload: any): Observable<UpcomingEventDto> {
    return this.http.post<UpcomingEventDto>(`${this.baseUrl}/api/upcoming-events`, payload);
  }

  updateUpcomingEvent(id: number, payload: any): Observable<UpcomingEventDto> {
    return this.http.put<UpcomingEventDto>(`${this.baseUrl}/api/upcoming-events/${id}`, payload);
  }

  deleteUpcomingEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/upcoming-events/${id}`);
  }

  // Decisions
  getDecisions(): Observable<DecisionDto[]> {
    return this.http.get<DecisionDto[]>(`${this.baseUrl}/api/council/decisions`);
  }

  addDecision(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/council/decisions`, payload);
  }

  updateDecision(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/council/decisions/${id}`, payload);
  }

  deleteDecision(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/council/decisions/${id}`);
  }

  // Branches
  getBranches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/council/branches`);
  }

  // Albums & Media
  getAlbums(): Observable<MediaAlbumDto[]> {
    return this.http.get<MediaAlbumDto[]>(`${this.baseUrl}/api/albums`);
  }

  getAlbum(id: number): Observable<MediaAlbumDto> {
    return this.http.get<MediaAlbumDto>(`${this.baseUrl}/api/albums/${id}`);
  }

  createAlbum(payload: any): Observable<MediaAlbumDto> {
    return this.http.post<MediaAlbumDto>(`${this.baseUrl}/api/albums`, payload);
  }

  updateAlbum(id: number, payload: any): Observable<MediaAlbumDto> {
    return this.http.put<MediaAlbumDto>(`${this.baseUrl}/api/albums/${id}`, payload);
  }

  deleteAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/albums/${id}`);
  }

  addMediaItemsToAlbum(albumId: number, items: Array<{ filePath: string; mediaType: string; title?: string; caption?: string; fileSize?: number }>): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/albums/${albumId}/media`, items);
  }

  deleteMediaItem(albumId: number, mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/albums/${albumId}/media/${mediaId}`);
  }

  // Finance
  getFinancialSummary(): Observable<FinancialSummaryDto> {
    return this.http.get<FinancialSummaryDto>(`${this.baseUrl}/api/finance/summary`);
  }

  getFinancialRecords(filter?: { recordType?: string; category?: string; startDate?: string; endDate?: string; search?: string }): Observable<FinancialRecordDto[]> {
    let params = new HttpParams();
    if (filter?.recordType && filter.recordType !== 'all') params = params.set('recordType', filter.recordType);
    if (filter?.category && filter.category !== 'all') params = params.set('category', filter.category);
    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);
    if (filter?.search) params = params.set('search', filter.search);
    return this.http.get<FinancialRecordDto[]>(`${this.baseUrl}/api/finance/records`, { params });
  }

  addFinancialRecord(payload: any): Observable<FinancialRecordDto> {
    return this.http.post<FinancialRecordDto>(`${this.baseUrl}/api/finance/records`, payload);
  }

  updateFinancialRecord(id: number, payload: any): Observable<FinancialRecordDto> {
    return this.http.put<FinancialRecordDto>(`${this.baseUrl}/api/finance/records/${id}`, payload);
  }

  deleteFinancialRecord(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/finance/records/${id}`);
  }

  // Settings
  getSettings(): Observable<SiteSettingsDto> {
    return this.http.get<SiteSettingsDto>(`${this.baseUrl}/api/council/settings`);
  }

  updateSettings(payload: SiteSettingsDto): Observable<SiteSettingsDto> {
    return this.http.put<SiteSettingsDto>(`${this.baseUrl}/api/council/settings`, payload);
  }
}
