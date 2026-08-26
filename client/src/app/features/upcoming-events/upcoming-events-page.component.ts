import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, UpcomingEventDto } from '../../council-api.service';

@Component({
  selector: 'app-upcoming-events-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upcoming-events-page.component.html',
  styleUrl: './upcoming-events-page.component.scss'
})
export class UpcomingEventsPageComponent implements OnInit {
  private readonly api = inject(CouncilApiService);

  events = signal<UpcomingEventDto[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;

  eventTypes = [
    'مناسبة عامة',
    'فرح وزفاف',
    'حفل تكريم وتفوق',
    'عزاء ومواساة',
    'اجتماع مجلس العائلة',
    'مبادرة تكافل وصحة'
  ];

  model = {
    title: '',
    description: '',
    eventDate: new Date().toISOString().slice(0, 10),
    location: '',
    eventType: 'مناسبة عامة',
    contactPerson: ''
  };

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading.set(true);
    this.api.getUpcomingEvents(false).subscribe({
      next: (data) => {
        this.events.set(data);
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
      description: '',
      eventDate: new Date().toISOString().slice(0, 10),
      location: '',
      eventType: 'مناسبة عامة',
      contactPerson: ''
    };
    this.showModal.set(true);
  }

  openEditModal(item: UpcomingEventDto) {
    this.isEditing.set(true);
    this.editingId = item.id;
    this.model = {
      title: item.title,
      description: item.description || '',
      eventDate: item.eventDate ? item.eventDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      location: item.location || '',
      eventType: item.eventType || 'مناسبة عامة',
      contactPerson: item.contactPerson || ''
    };
    this.showModal.set(true);
  }

  submitEvent() {
    if (!this.model.title.trim()) {
      alert('عنوان المناسبة مطلوب');
      return;
    }

    const payload = {
      title: this.model.title.trim(),
      description: this.model.description.trim() || undefined,
      eventDate: new Date(this.model.eventDate).toISOString(),
      location: this.model.location.trim() || undefined,
      eventType: this.model.eventType,
      contactPerson: this.model.contactPerson.trim() || undefined
    };

    const req$ = this.isEditing() && this.editingId
      ? this.api.updateUpcomingEvent(this.editingId, payload)
      : this.api.addUpcomingEvent(payload);

    req$.subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadEvents();
      }
    });
  }

  deleteEvent(id: number) {
    if (!confirm('هل تريد بالتأكيد حذف هذه المناسبة؟')) return;
    this.api.deleteUpcomingEvent(id).subscribe({
      next: () => this.loadEvents()
    });
  }
}
