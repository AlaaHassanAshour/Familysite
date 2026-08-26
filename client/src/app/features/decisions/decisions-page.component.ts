import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, DecisionDto } from '../../council-api.service';

@Component({
  selector: 'app-decisions-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './decisions-page.component.html',
  styleUrl: './decisions-page.component.scss'
})
export class DecisionsPageComponent implements OnInit {
  readonly api = inject(CouncilApiService);

  decisions = signal<DecisionDto[]>([]);
  isLoading = signal(true);
  isUploading = signal(false);

  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;

  model = {
    title: '',
    details: '',
    decisionDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    status: 'Approved',
    attachmentUrl: ''
  };

  ngOnInit() {
    this.loadDecisions();
  }

  loadDecisions() {
    this.isLoading.set(true);
    this.api.getDecisions().subscribe({
      next: (data) => {
        this.decisions.set(data as DecisionDto[]);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.editingId = null;
    this.model = {
      title: '',
      details: '',
      decisionDate: new Date().toISOString().slice(0, 10),
      referenceNumber: '',
      status: 'Approved',
      attachmentUrl: ''
    };
    this.showModal.set(true);
  }

  openEditModal(item: DecisionDto) {
    this.isEditing.set(true);
    this.editingId = item.id;
    this.model = {
      title: item.title,
      details: item.details || '',
      decisionDate: item.decisionDate ? item.decisionDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      referenceNumber: item.referenceNumber || '',
      status: item.status || 'Approved',
      attachmentUrl: item.attachmentUrl || ''
    };
    this.showModal.set(true);
  }

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.api.uploadSingle(file, 'general').subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.model.attachmentUrl = res.url;
      },
      error: () => {
        this.isUploading.set(false);
        alert('حدث خطأ أثناء رفع ملف القرار');
      }
    });
  }

  submitDecision() {
    if (!this.model.title.trim()) {
      alert('عنوان القرار مطلوب');
      return;
    }

    const payload = {
      title: this.model.title.trim(),
      details: this.model.details.trim() || undefined,
      decisionDate: new Date(this.model.decisionDate).toISOString(),
      referenceNumber: this.model.referenceNumber.trim() || undefined,
      status: this.model.status,
      attachmentUrl: this.model.attachmentUrl || undefined
    };

    const req$ = this.isEditing() && this.editingId
      ? this.api.updateDecision(this.editingId, payload)
      : this.api.addDecision(payload);

    req$.subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadDecisions();
      }
    });
  }

  deleteDecision(id: number) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا القرار؟')) return;
    this.api.deleteDecision(id).subscribe({
      next: () => this.loadDecisions()
    });
  }
}
