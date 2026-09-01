import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, ActivityDto } from '../../council-api.service';

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
        <div class="title-area">
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
                <button (click)="openEditModal(item)" title="تعديل">✏️</button>
                <button class="delete" (click)="deleteActivity(item.id)" title="حذف">🗑️</button>
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
                <input name="title" [(ngModel)]="formValue.title" required placeholder="أدخل عنوان النشاط..." />
              </label>

              <label>
                الوصف
                <textarea name="description" [(ngModel)]="formValue.description" rows="3" placeholder="تفاصيل النشاط..."></textarea>
              </label>

              <label>
                تاريخ ووقت الفعالية *
                <input type="datetime-local" name="scheduledAt" [(ngModel)]="formValue.scheduledAt" required />
              </label>

              <label>
                اللجنة التابعة لها *
                <!-- استبدال [value] بـ [ngValue] للحفاظ على Type كنظام أرقام -->
                <select name="committeeId" [(ngModel)]="formValue.committeeId" required>
                  <option [ngValue]="0" disabled>اختر اللجنة</option>
                  <option *ngFor="let c of committees()" [ngValue]="c.id">{{ c.name }}</option>
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
              <button class="save" type="submit" [disabled]="!isFormValid()">
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
      box-sizing: border-box;
      width: 100%;
    }

    .view-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
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
      white-space: nowrap;
      transition: background 0.2s;
    }
    .btn-add:hover { background: #d0674e; }

    .activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
      box-sizing: border-box;
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
      font-size: 1.1rem;
    }

    .activity-card h2 {
      font-size: 1.2rem;
      margin: 12px 0 6px 0;
      color: #0f172a;
      word-break: break-word;
    }

    .activity-card .desc {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 16px;
      word-break: break-word;
    }

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

    /* Modal Styling */
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
      padding: 12px;
      box-sizing: border-box;
    }

    .activity-form {
      background: #fff;
      border-radius: 14px;
      padding: 24px;
      width: 100%;
      max-width: 500px;
      box-sizing: border-box;
      max-height: calc(100vh - 24px);
      overflow-y: auto;
      overscroll-behavior: contain;
      animation: modalFadeIn 0.2s ease-out;
    }

    .form-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .form-heading h3 { margin: 0; font-size: 1.2rem; color: #0f172a; }
    .close {
      border: none;
      background: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      line-height: 1;
    }

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
      color: #334155;
    }
    .fields-grid input, .fields-grid select, .fields-grid textarea {
      width: 100%;
      padding: 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }
    .fields-grid input:focus, .fields-grid select:focus, .fields-grid textarea:focus {
      border-color: #e0785f;
    }
    .fields-grid textarea { resize: vertical; min-height: 80px; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }
    .form-actions button {
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      font-family: inherit;
    }
    .form-actions .cancel { background: #f1f5f9; color: #475569; }
    .form-actions .save { background: #e0785f; color: #fff; }
    .form-actions .save:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Media Queries for Responsiveness */
    @media (max-width: 640px) {
      .activities-container {
        padding: 12px;
      }
      .view-heading {
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .btn-add {
        width: 100%;
        padding: 12px;
        text-align: center;
      }
      .activities-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .activity-form {
        padding: 16px;
        border-radius: 12px;
      }
      .form-actions {
        flex-direction: column-reverse;
        gap: 8px;
      }
      .form-actions button {
        width: 100%;
        padding: 12px;
      }
    }
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
    const defaultCommittee = this.committees().length > 0 ? this.committees()[0].id : 0;

    this.formValue = {
      title: '',
      description: '',
      scheduledAt: this.toLocalISOString(new Date()),
      status: 'قادم',
      committeeId: defaultCommittee
    };
    this.isModalOpen.set(true);
  }

  protected openEditModal(activity: ActivityDto): void {
    this.isEditMode.set(true);
    const dateFormatted = activity.scheduledAt ? this.toLocalISOString(new Date(activity.scheduledAt)) : '';

    this.formValue = {
      id: activity.id,
      title: activity.title,
      description: activity.description || '',
      scheduledAt: dateFormatted,
      status: activity.status || 'قادم',
      committeeId: Number(activity.committeeId)
    };
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
  }

  protected isFormValid(): boolean {
    return Boolean(
      this.formValue.title?.trim() &&
      Number(this.formValue.committeeId) > 0 &&
      this.formValue.scheduledAt
    );
  }

  protected saveActivity(): void {
    if (!this.isFormValid()) return;

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

  // تحويل التوقيت إلى صيغة YYYY-MM-Thh:mm المتوافقة مع datetime-local حسب التوقيت المحلي للمستخدم
  private toLocalISOString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  }
}
