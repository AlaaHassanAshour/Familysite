import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, MemberDto } from '../../council-api.service';

export interface MemberFormValue {
  fullName: string;
  nationalId: string;
  birthDate: string;
  phone: string;
  email: string;
  status: string;
  gender: string;
  isCouncilMember: boolean;
  councilRole: string;
  branchId: number;
  fatherId: number | null;
  photoUrl: string | null;
}

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-form.component.html',
  styleUrl: './member-form.component.scss',
})
export class MemberFormComponent implements OnInit {
  private readonly api = inject(CouncilApiService);

  @Output() submitted = new EventEmitter<MemberFormValue>();
  @Output() cancelled = new EventEmitter<void>();
  @Input() member?: MemberFormValue & { id?: number };

  allMembers = signal<MemberDto[]>([]);
  branches = signal<any[]>([]);
  isUploading = signal(false);
  photoPreview: string | null = null;

  value: MemberFormValue = {
    fullName: '',
    nationalId: '',
    birthDate: '',
    phone: '',
    email: '',
    status: 'متزوج',
    gender: 'ذكر',
    isCouncilMember: false,
    councilRole: 'فرد عائلة',
    branchId: 1,
    fatherId: null,
    photoUrl: null,
  };

  ngOnInit(): void {
    this.loadMetadata();
    if (this.member) {
      this.value = { ...this.value, ...this.member };
      if (this.value.photoUrl) {
        this.photoPreview = this.api.getMediaUrl(this.value.photoUrl);
      }
    }
  }

  private loadMetadata(): void {
    this.api.getMembers().subscribe(data => {
      // Filter out self if editing
      const filtered = this.member?.id ? data.filter(m => m.id !== this.member?.id) : data;
      this.allMembers.set(filtered);
    });

    this.api.getBranches().subscribe(data => {
      this.branches.set(data);
    });
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = String(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server directly
    this.isUploading.set(true);
    this.api.uploadSingle(file, 'members').subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.value.photoUrl = res.url;
      },
      error: () => {
        this.isUploading.set(false);
        alert('حدث خطأ أثناء رفع الصورة على السيرفر');
      }
    });
  }

  submit(): void {
    if (!this.value.fullName) {
      alert('يرجى كتابة الاسم الرباعي كاملاً');
      return;
    }
    this.submitted.emit(this.value);
  }
}
