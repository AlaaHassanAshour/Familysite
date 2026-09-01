import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CouncilApiService } from '../../../council-api.service';

export interface MemberItem {
  id: number;
  fullName: string;
  nationalId?: string; // أضفنا رقم الهوية
}
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
membersList: MemberItem[] = [];
 searchTerm: string = '';
  isDropdownOpen: boolean = false;
  isEditMode: boolean = false;
  isChairpersonDropdownOpen: boolean = false;
chairpersonSearchTerm: string = '';
  @Output() submitted = new EventEmitter<CommitteeFormValue>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() committee?: CommitteeFormValue | null = null;

  protected value: CommitteeFormValue = {
    name: '',
    description: '',
    chairpersonId: 0,
    memberIds: []
  };

  constructor(private councilApiService: CouncilApiService, private eRef: ElementRef) {}

  ngOnInit(): void {
    this.getMembers();
  }
// إغلاق قائمة البحث تلقائياً عند النقر خارجها
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
          this.isChairpersonDropdownOpen = false;

    }
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
// إظهار العضو المختار حالياً كرئيس للجنة
get selectedChairperson(): MemberItem | undefined {
  return this.membersList.find(m => m.id === Number(this.value.chairpersonId));
}

// قائمة رؤساء اللجان المفلترة بالبحث
get filteredChairpersons(): MemberItem[] {
  if (!this.chairpersonSearchTerm.trim()) return this.membersList;
  const term = this.chairpersonSearchTerm.toLowerCase().trim();
  return this.membersList.filter(m =>
    m.fullName.toLowerCase().includes(term) ||
    (m.nationalId && m.nationalId.includes(term))
  );
}

// تحديد رئيس اللجنة وإغلاق القائمة
selectChairperson(memberId: number): void {
  this.value.chairpersonId = memberId;
  this.isChairpersonDropdownOpen = false;
}

// تحديث الـ HostListener لإغلاق القائمتين عند الضغط خارج المودال
// @HostListener('document:click', ['$event'])
// clickout(event: Event) {
//   if (!this.eRef.nativeElement.contains(event.target)) {
//     this.isDropdownOpen = false;
//     this.isChairpersonDropdownOpen = false;
//   }
// }
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
// فلترة القائمة بناءً على الاسم أو رقم الهوية
  get filteredMembers(): MemberItem[] {
    if (!this.searchTerm.trim()) return this.membersList;
    const term = this.searchTerm.toLowerCase().trim();
    return this.membersList.filter(m =>
      m.fullName.toLowerCase().includes(term) ||
      (m.nationalId && m.nationalId.includes(term))
    );
  }

  // إرجاع قائمة الأعضاء المختارين لعرضهم كـ Chips
  get selectedMembers(): MemberItem[] {
    return this.membersList.filter(m => this.value.memberIds.includes(m.id));
  }

protected toggleMember(memberId: number): void {
  const index = this.value.memberIds.indexOf(memberId);
  if (index > -1) {
    this.value.memberIds.splice(index, 1);
  } else {
    this.value.memberIds.push(memberId);
  }
}
protected removeMember(memberId: number, event: Event): void {
    event.stopPropagation();
    this.value.memberIds = this.value.memberIds.filter(id => id !== memberId);
  }
  protected isMemberSelected(memberId: number): boolean {
    return this.value.memberIds.includes(memberId);
  }
  protected toggleAllFiltered(): void {
    const filteredIds = this.filteredMembers.map(m => m.id);
    const allSelected = filteredIds.every(id => this.value.memberIds.includes(id));

    if (allSelected) {
      this.value.memberIds = this.value.memberIds.filter(id => !filteredIds.includes(id));
    } else {
      const newIds = new Set([...this.value.memberIds, ...filteredIds]);
      this.value.memberIds = Array.from(newIds);
    }
  }
}
