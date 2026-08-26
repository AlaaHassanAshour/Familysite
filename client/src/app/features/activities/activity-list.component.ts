import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, SlicePipe, DatePipe } from '@angular/common';
import { ActivityDto } from '../../council-api.service';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, SlicePipe, DatePipe],
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.scss',
})
export class ActivityListComponent {
  @Input() activities: ActivityDto[] = [];

  @Output() addRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<ActivityDto>();
  @Output() deleteRequested = new EventEmitter<number>();

  protected onAdd(): void {
    this.addRequested.emit();
  }

  protected onEdit(activity: ActivityDto): void {
    this.editRequested.emit(activity);
  }

  protected onDelete(id: number): void {
    this.deleteRequested.emit(id);
  }
}
