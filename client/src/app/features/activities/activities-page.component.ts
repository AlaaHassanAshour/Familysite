import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, ActivityDto } from '../../council-api.service'; // <-- استورد ActivityDto من هنا

export interface CreateActivityRequest {
  id?: number;
  title: string;
  description?: string;
  scheduledAt: string;
  status: string;
  committeeId: number;
}



@Component({
  selector: 'app-activities-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
template: `
    <section class="activities-container">
      <div class="view-heading">
        <div>
          <p class="subtitle">مجلس العائلة</p>
          <h1>الأنشطة والفعاليات</h1>
          <span class="desc-text">متابعة وتوثيق كافة الفعاليات الخاصة باللجان.</span>
        </div>
        <button class="btn-add" (click)="openCreateModal()">＋ إضافة نشاط جديد</button>
      </div>

      <!-- قائمة الأنشطة -->
      <div class="activities-grid">
        @for (item of activities(); track item.id) {
          <article class="activity-card">
            <div class="card-header">
              <span class="badge" [ngClass]="item.status">{{ item.status }}</span>
              <div class="actions">
                <button (click)="openEditModal(item)">✏️</button>
                <button class="delete" (click)="deleteActivity(item.id)">🗑️</button>
              </div>
            </div>

            <h2>{{ item.title }}</h2>
            <p class="desc">{{ item.description }}</p>

            <div class="card-footer">
              <span>📅 {{ item.scheduledAt | date:'mediumDate' }}</span>
              <span>🏛️ {{ item.committeeName || 'لجنة خاصة' }}</span>
            </div>
          </article>
        } @empty {
          <div class="empty">لا توجد أنشطة أو فعاليات مسجلة حالياً.</div>
        }
      </div>

      <!-- Modal الإضافة والتعديل -->
      @if (isModalOpen()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <form class="activity-form" (click)="$event.stopPropagation()" (ngSubmit)="saveActivity()">
            <div class="form-heading">
              <h3>{{ isEditMode() ? 'تعديل نشاط' : 'إضافة نشاط جديد' }}</h3>
              <button type="button" class="close" (click)="closeModal()">×</button>
            </div>

            <div class="fields-grid">
              <label>
                عنوان النشاط *
                <input name="title" [(ngModel)]="formValue.title" required />
              </label>

              <label>
                الوصف
                <textarea name="description" [(ngModel)]="formValue.description" rows="3"></textarea>
              </label>

              <label>
                تاريخ ووقت الفعالية *
                <input type="datetime-local" name="scheduledAt" [(ngModel)]="formValue.scheduledAt" required />
              </label>

              <label>
                اللجنة التابعة لها *
                <select name="committeeId" [(ngModel)]="formValue.committeeId" required>
                  <option [ngValue]="0" disabled selected>اختر اللجنة</option>
                  <option *ngFor="let c of committees()" [value]="c.id">{{ c.name }}</option>
                </select>
              </label>

              <label>
                حالة النشاط *
                <select name="status" [(ngModel)]="formValue.status" required>
                  <option *ngFor="let st of statusOptions" [value]="st">{{ st }}</option>
                </select>
              </label>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel" (click)="closeModal()">إلغاء</button>
              <button class="save" type="submit" [disabled]="!formValue.title || !formValue.committeeId || !formValue.scheduledAt">
                {{ isEditMode() ? 'حفظ التغييرات' : 'إضافة النشاط' }}
              </button>
            </div>
          </form>
        </div>
      }
    </section>
  `,
  styles: [`
    .activities-container {
      padding: 24px;
      direction: rtl;
    }
    .view-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .view-heading h1 { font-size: 1.8rem; margin: 4px 0; color: #1e293b; }
    .subtitle { color: #e0785f; font-weight: 700; margin: 0; }
    .desc-text { color: #64748b; font-size: 0.95rem; }
    .btn-add {
      background: #e0785f;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .activity-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      background: #f1f5f9;
      color: #475569;
    }
    .badge.قادم { background: #e0f2fe; color: #0369a1; }
    .badge.مكتمل { background: #dcfce7; color: #15803d; }
    .badge.ملغى { background: #fee2e2; color: #b91c1c; }
    .actions button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .activity-card h2 { font-size: 1.2rem; margin: 12px 0 6px 0; color: #0f172a; }
    .activity-card .desc { font-size: 0.9rem; color: #64748b; line-height: 1.5; margin-bottom: 16px; }
    .card-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    .empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: #94a3b8;
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .activity-form {
      background: #fff;
      border-radius: 14px;
      padding: 24px;
      width: 100%;
      max-width: 500px;
    }
    .form-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .form-heading h3 { margin: 0; }
    .close { border: none; background: none; font-size: 1.5rem; cursor: pointer; }
    .fields-grid {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .fields-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .fields-grid input, .fields-grid select, .fields-grid textarea {
      padding: 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      outline: none;
    }
    .fields-grid input:focus, .fields-grid select:focus, .fields-grid textarea:focus {
      border-color: #e0785f;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    .form-actions button {
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .form-actions .cancel { background: #f1f5f9; }
    .form-actions .save { background: #e0785f; color: #fff; }
  `]
})
export class ActivitiesPageComponent implements OnInit {
  private readonly api = inject(CouncilApiService);

  protected activities = signal<ActivityDto[]>([]);
  protected committees = signal<{ id: number; name: string }[]>([]);
  protected isModalOpen = signal<boolean>(false);
  protected isEditMode = signal<boolean>(false);

  protected statusOptions = ['قادم', 'مكتمل', 'ملغى'];

  protected formValue: CreateActivityRequest = {
    title: '',
    description: '',
    scheduledAt: '',
    status: 'قادم',
    committeeId: 0
  };

  ngOnInit(): void {
    this.loadActivities();
    this.loadCommittees();
  }

  protected loadActivities(): void {
    this.api.getActivities().subscribe({
      next: (data) => this.activities.set(data),
      error: (err) => console.error('Error loading activities:', err)
    });
  }

  protected loadCommittees(): void {
    this.api.getCommittees().subscribe({
      next: (data) => this.committees.set(data),
      error: (err) => console.error('Error loading committees:', err)
    });
  }

  protected openCreateModal(): void {
    this.isEditMode.set(false);
    this.formValue = {
      title: '',
      description: '',
      scheduledAt: new Date().toISOString().slice(0, 16),
      status: 'قادم',
      committeeId: this.committees().length > 0 ? this.committees()[0].id : 0
    };
    this.isModalOpen.set(true);
  }

  protected openEditModal(activity: ActivityDto): void {
    this.isEditMode.set(true);
    const dateFormatted = activity.scheduledAt ? new Date(activity.scheduledAt).toISOString().slice(0, 16) : '';
    this.formValue = {
      id: activity.id,
      title: activity.title,
      description: activity.description || '',
      scheduledAt: dateFormatted,
      status: activity.status || 'قادم',
      committeeId: activity.committeeId
    };
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected saveActivity(): void {
    if (!this.formValue.title || !this.formValue.committeeId || !this.formValue.scheduledAt) {
      return;
    }

    const payload: CreateActivityRequest = {
      ...this.formValue,
      committeeId: Number(this.formValue.committeeId),
      scheduledAt: new Date(this.formValue.scheduledAt).toISOString()
    };

    if (this.isEditMode() && this.formValue.id) {
      this.api.updateActivity(this.formValue.id, payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadActivities();
        },
        error: (err) => console.error('Error updating activity:', err)
      });
    } else {
      this.api.addActivity(payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadActivities();
        },
        error: (err) => console.error('Error creating activity:', err)
      });
    }
  }

  protected deleteActivity(id: number): void {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا النشاط؟')) {
      this.api.deleteActivity(id).subscribe({
        next: () => this.loadActivities(),
        error: (err) => console.error('Error deleting activity:', err)
      });
    }
  }
}
