import { Component, inject, signal } from '@angular/core';
import { CommitteeDto, CouncilApiService } from '../../council-api.service';
import { CommitteeListComponent } from './committee-list.component';
import { CommitteeDetailsComponent } from './committee-details.component';
import { Addcommittees, CommitteeFormValue } from './addcommittees/addcommittees';

@Component({
  selector: 'app-committees-page',
  standalone: true,
  imports: [CommitteeListComponent, CommitteeDetailsComponent, Addcommittees],
  template: `
    @if (isCreating()) {
      <div class="modal-backdrop">
        <app-addcommittees
          [committee]="selectedCommitteeForEdit()"
          (submitted)="onSaveCommittee($event)"
          (cancelled)="closeModal()"
        />
      </div>
    }

    @if (selected(); as id) {
      <app-committee-details [committeeId]="id" />
      <button class="back" (click)="selected.set(null)">← العودة إلى قائمة اللجان</button>
    } @else {
      <app-committee-list
        [committees]="committees()"
        (selected)="selected.set($event)"
        (addRequested)="openCreateModal()"
        (editRequested)="openEditModal($event)"
        (deleteRequested)="onDeleteCommittee($event)"
      />
    }
  `,
  styles: [
    `
      .back {
        position: fixed;
        top: 85px;
        left: 35px;
        border: 0;
        background: #1b4d3e;
        color: #fff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-family: inherit;
        font-weight: 700;
        font-size: 0.9rem;
        z-index: 10;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }
      .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(18, 40, 32, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
    `,
  ],
})
export class CommitteesPageComponent {
  private readonly api = inject(CouncilApiService);

  protected committees = signal<CommitteeDto[]>([]);
  protected selected = signal<number | null>(null);
  protected isCreating = signal<boolean>(false);
  protected selectedCommitteeForEdit = signal<CommitteeFormValue | null>(null);

  constructor() {
    this.load();
  }

  protected openCreateModal(): void {
    this.selectedCommitteeForEdit.set(null);
    this.isCreating.set(true);
  }

  protected openEditModal(committee: CommitteeDto): void {
    this.api.getCommittee(committee.id).subscribe({
      next: (details) => {
        this.selectedCommitteeForEdit.set({
          id: details.id,
          name: details.name,
          description: details.description || '',
          chairpersonId: details.chairperson?.id || 0,
          memberIds: details.members ? details.members.map((m: any) => m.id) : []
        });
        this.isCreating.set(true);
      },
      error: () => {
        this.selectedCommitteeForEdit.set({
          id: committee.id,
          name: committee.name,
          description: committee.description || '',
          chairpersonId: committee.chairpersonId,
          memberIds: []
        });
        this.isCreating.set(true);
      }
    });
  }

  protected closeModal(): void {
    this.isCreating.set(false);
    this.selectedCommitteeForEdit.set(null);
  }

  private load(): void {
    this.api.getCommittees().subscribe({
      next: (items) => this.committees.set(items),
      error: (err) => console.error('Error loading committees:', err)
    });
  }

  protected onSaveCommittee(formData: CommitteeFormValue): void {
    if (formData.id) {
      this.api.updateCommittee(formData.id, formData).subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: (err) => console.error('Error updating committee:', err)
      });
    } else {
      this.api.addCommittee(formData).subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: (err) => console.error('Error creating committee:', err)
      });
    }
  }

  protected onDeleteCommittee(id: number): void {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه اللجنة؟')) {
      this.api.deleteCommittee(id).subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error deleting committee:', err)
      });
    }
  }
}
