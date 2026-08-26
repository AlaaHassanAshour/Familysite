import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CouncilApiService } from '../../../council-api.service';

export interface CommitteeFormValue {
  id?: number;
  name: string;
  description: string;
  chairpersonId: number;
  memberIds: number[];
}

@Component({
  selector: 'app-addcommittees',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './addcommittees.html',
  styleUrl: './addcommittees.scss',
})
export class Addcommittees implements OnInit, OnChanges {
  membersList: { id: number; fullName: string }[] = [];
  isEditMode: boolean = false;

  @Output() submitted = new EventEmitter<CommitteeFormValue>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() committee?: CommitteeFormValue | null = null;

  protected value: CommitteeFormValue = {
    name: '',
    description: '',
    chairpersonId: 0,
    memberIds: []
  };

  constructor(private councilApiService: CouncilApiService) {}

  ngOnInit(): void {
    this.getMembers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['committee'] && this.committee) {
      this.isEditMode = !!this.committee.id;
      this.value = {
        id: this.committee.id,
        name: this.committee.name || '',
        description: this.committee.description || '',
        chairpersonId: this.committee.chairpersonId || 0,
        memberIds: this.committee.memberIds ? [...this.committee.memberIds] : []
      };
    } else if (!this.committee) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.isEditMode = false;
    this.value = {
      name: '',
      description: '',
      chairpersonId: 0,
      memberIds: []
    };
  }

  protected submit(): void {
    if (this.value.name && this.value.chairpersonId > 0) {
      const payload: CommitteeFormValue = {
        ...(this.value.id ? { id: this.value.id } : {}),
        name: this.value.name,
        description: this.value.description || '',
        chairpersonId: Number(this.value.chairpersonId),
        memberIds: this.value.memberIds.map(id => Number(id))
      };
      this.submitted.emit(payload);
    }
  }

  protected getMembers(): void {
    this.councilApiService.getMembers().subscribe({
      next: (items: any) => {
        this.membersList = items;
        console.log('Members loaded:', this.membersList);
      },
      error: (err) => console.error('Error loading members:', err)
    });
  }

  protected toggleMember(memberId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.value.memberIds.includes(memberId)) {
        this.value.memberIds.push(memberId);
      }
    } else {
      this.value.memberIds = this.value.memberIds.filter(id => id !== memberId);
    }
  }

  protected isMemberSelected(memberId: number): boolean {
    return this.value.memberIds.includes(memberId);
  }
}
