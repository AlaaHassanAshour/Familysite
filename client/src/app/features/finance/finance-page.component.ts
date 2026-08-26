import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, FinancialSummaryDto, FinancialRecordDto } from '../../council-api.service';

@Component({
  selector: 'app-finance-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-page.component.html',
  styleUrl: './finance-page.component.scss'
})
export class FinancePageComponent implements OnInit {
  readonly api = inject(CouncilApiService);

  summary = signal<FinancialSummaryDto | null>(null);
  records = signal<FinancialRecordDto[]>([]);
  isLoading = signal(true);
  isUploading = signal(false);

  // Filters
  filterType = 'all';
  filterCategory = 'all';
  searchQuery = '';

  // Modals
  showAddModal = signal(false);
  modalType: 'Income' | 'Expense' = 'Expense';

  newRecord = {
    recordType: 'Expense',
    category: 'مساعدات إنسانية',
    amount: 0,
    transactionDate: new Date().toISOString().slice(0, 10),
    voucherNumber: '',
    partyName: '',
    description: '',
    attachmentUrl: ''
  };

  attachmentPreview: string | null = null;

  categories = [
    'مساعدات إنسانية',
    'كفالات أيتام ورعاية',
    'فعاليات وأنشطة',
    'مصاريف تشغيلية وديوان',
    'تبرعات واردة',
    'اشتراكات أعضاء',
    'أخرى'
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.api.getFinancialSummary().subscribe({
      next: (s) => this.summary.set(s)
    });

    this.api.getFinancialRecords({
      recordType: this.filterType,
      category: this.filterCategory,
      search: this.searchQuery
    }).subscribe({
      next: (data) => {
        this.records.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange() {
    this.loadData();
  }

  resetFilters() {
    this.filterType = 'all';
    this.filterCategory = 'all';
    this.searchQuery = '';
    this.loadData();
  }

  openAddModal(type: 'Income' | 'Expense') {
    this.modalType = type;
    this.newRecord = {
      recordType: type,
      category: type === 'Income' ? 'تبرعات واردة' : 'مساعدات إنسانية',
      amount: 0,
      transactionDate: new Date().toISOString().slice(0, 10),
      voucherNumber: '',
      partyName: '',
      description: '',
      attachmentUrl: ''
    };
    this.attachmentPreview = null;
    this.showAddModal.set(true);
  }

  uploadAttachment(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.api.uploadSingle(file, 'finance').subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.newRecord.attachmentUrl = res.url;
        this.attachmentPreview = res.url;
      },
      error: () => {
        this.isUploading.set(false);
        alert('فشل رفع مرفق السند');
      }
    });
  }

  submitRecord() {
    if (this.newRecord.amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    if (!this.newRecord.description.trim()) {
      alert('يرجى كتابة بيان وسبب الصرف أو القبض');
      return;
    }

    this.api.addFinancialRecord(this.newRecord).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.loadData();
      }
    });
  }

  deleteRecord(id: number) {
    if (!confirm('هل تريد بالتأكيد حذف هذا القيد المالي؟')) return;

    this.api.deleteFinancialRecord(id).subscribe({
      next: () => this.loadData()
    });
  }
}
