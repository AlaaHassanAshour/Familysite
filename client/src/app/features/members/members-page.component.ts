import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberDto, CouncilApiService } from '../../council-api.service';
import { MemberListComponent } from './member-list.component';
import { MemberFormComponent, MemberFormValue } from './member-form.component';

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [CommonModule, MemberListComponent, MemberFormComponent],
  template: `
    <app-member-list
      [members]="members()"
      [branches]="branches()"
      (addRequested)="showCreate.set(true)"
      (editRequested)="edit($event)"
      (deleteRequested)="remove($event)"
      (filterChanged)="onFilterChanged($event)"
    />
    
    @if (editing(); as member) {
      <div class="modal-layer">
        <app-member-form
          [member]="member"
          (submitted)="save($event)"
          (cancelled)="editing.set(null)"
        />
      </div>
    }
    
    @if (showCreate()) {
      <div class="modal-layer">
        <app-member-form
          (submitted)="save($event)"
          (cancelled)="showCreate.set(false)"
        />
      </div>
    }
  `,
  styles: [`
    .modal-layer {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(18, 40, 32, 0.6);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      padding: 20px;
    }
  `]
})
export class MembersPageComponent implements OnInit {
  private readonly api = inject(CouncilApiService);
  
  protected members = signal<MemberDto[]>([]);
  protected branches = signal<any[]>([]);
  protected editing = signal<(MemberFormValue & { id?: number }) | null>(null);
  protected showCreate = signal(false);

  private currentFilter: any = {};

  ngOnInit(): void {
    this.load();
    this.api.getBranches().subscribe(b => this.branches.set(b));
  }

  protected load(): void {
    this.api.getMembers(this.currentFilter).subscribe((data) => this.members.set(data));
  }

  protected onFilterChanged(filter: any): void {
    this.currentFilter = filter;
    this.load();
  }

  protected edit(member: MemberDto): void {
    this.editing.set({
      id: member.id,
      fullName: member.fullName,
      nationalId: member.nationalId ?? '',
      birthDate: member.birthDate ? member.birthDate.slice(0, 10) : '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      status: member.status || 'متزوج',
      gender: member.gender || 'ذكر',
      isCouncilMember: member.isCouncilMember,
      councilRole: member.councilRole || 'عضو مجلس',
      branchId: member.branchId,
      fatherId: member.fatherId ?? null,
      photoUrl: member.photoUrl ?? null
    });
  }

  protected save(value: MemberFormValue): void {
    const id = this.editing()?.id;
    const request$ = id ? this.api.updateMember(id, value) : this.api.addMember(value);
    
    request$.subscribe(() => {
      this.editing.set(null);
      this.showCreate.set(false);
      this.load();
    });
  }

  protected remove(id: number): void {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا العضو من سجل العائلة؟')) {
      this.api.deleteMember(id).subscribe(() => this.load());
    }
  }
}
