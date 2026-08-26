import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberDto, CouncilApiService } from '../../council-api.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent {
  readonly api = inject(CouncilApiService);

  @Input() members: MemberDto[] = [];
  @Input() branches: any[] = [];
  @Output() addRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<MemberDto>();
  @Output() deleteRequested = new EventEmitter<number>();
  @Output() filterChanged = new EventEmitter<{ branchId?: number; status?: string; isCouncilOnly?: boolean; search?: string }>();

  activeTab = signal<'list' | 'tree'>('list');
  selectedBranchId: number | null = null;
  selectedStatus: string = 'all';
  searchQuery: string = '';
  councilOnly: boolean = false;

  onFilterChange() {
    this.filterChanged.emit({
      branchId: this.selectedBranchId ? Number(this.selectedBranchId) : undefined,
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      isCouncilOnly: this.councilOnly ? true : undefined,
      search: this.searchQuery.trim() || undefined
    });
  }

  resetFilters() {
    this.selectedBranchId = null;
    this.selectedStatus = 'all';
    this.searchQuery = '';
    this.councilOnly = false;
    this.onFilterChange();
  }

  // Get root ancestors for tree view
  getRootMembers(): MemberDto[] {
    return this.members.filter(m => !m.fatherId);
  }

  // Get children of a specific member
  getChildren(fatherId: number): MemberDto[] {
    return this.members.filter(m => m.fatherId === fatherId);
  }
}
