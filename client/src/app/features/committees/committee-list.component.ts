import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommitteeDto } from '../../council-api.service';

@Component({
  selector: 'app-committee-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './committee-list.component.html',
  styleUrl: './committee-list.component.scss'
})
export class CommitteeListComponent {
  @Input() committees: CommitteeDto[] = [];

  @Output() selected = new EventEmitter<number>();
  @Output() addRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<CommitteeDto>();
  @Output() deleteRequested = new EventEmitter<number>();

  protected activeMenuId: number | null = null;

  // فتح/إغلاق قائمة الخيارات للكارت المحدد
  protected toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  // طلب التعديل
  protected onEdit(committee: CommitteeDto, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = null;
    this.editRequested.emit(committee);
  }

  // طلب الحذف
  protected onDelete(id: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuId = null;
    this.deleteRequested.emit(id);
  }
}
