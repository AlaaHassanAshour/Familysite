import { Component, inject, OnInit, signal } from '@angular/core';
import { CouncilApiService, SliderDto } from '../../council-api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SliderFormValue {
  title: string;
  badge?: string;
  subtitle?: string;
  imageUrl: string | null;
  buttonText?: string;
  buttonUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

@Component({
  selector: 'app-sliders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sliders.html',
  styleUrl: './sliders.scss',
})
export class SlidersComponent implements OnInit {
  protected readonly api = inject(CouncilApiService);

  sliders = signal<SliderDto[]>([]);
  isUploading = signal(false);
  isLoading = signal(false);

  isModalOpen = false;
  isEditMode = false;
  currentSliderId: number | null = null;
  photoPreview: string | null = null;

  value: SliderFormValue = {
    title: '',
    badge: '',
    subtitle: '',
    imageUrl: null,
    buttonText: '',
    buttonUrl: '',
    displayOrder: 0,
    isActive: true
  };

  ngOnInit(): void {
    this.loadSliders();
  }

  loadSliders(): void {
    this.isLoading.set(true);
    this.api.getSliders().subscribe({
      next: (data: SliderDto[]) => {
        this.sliders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('حدث خطأ أثناء تحميل السلايدرز', err);
        this.isLoading.set(false);
      }
    });
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = String(reader.result);
    };
    reader.readAsDataURL(file);

    this.isUploading.set(true);
    this.api.uploadSingle(file, 'sliders').subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.value.imageUrl = res.url;
      },
      error: () => {
        this.isUploading.set(false);
        alert('حدث خطأ أثناء رفع الصورة على السيرفر');
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentSliderId = null;
    this.photoPreview = null;
    this.value = {
      title: '',
      badge: '',
      subtitle: '',
      imageUrl: null,
      buttonText: '',
      buttonUrl: '',
      displayOrder: 0,
      isActive: true
    };
    this.isModalOpen = true;
  }

  openEditModal(slider: SliderDto): void {
    this.isEditMode = true;
    this.currentSliderId = slider.id;
    this.value = {
      title: slider.title,
      badge: slider.badge || '',
      subtitle: slider.subtitle || '',
      imageUrl: slider.imageUrl || null,
      buttonText: slider.buttonText || '',
      buttonUrl: slider.buttonUrl || '',
      displayOrder: slider.displayOrder,
      isActive: slider.isActive ?? true
    };
    this.photoPreview = slider.imageUrl ? this.api.getMediaUrl(slider.imageUrl) : null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  submit(): void {
    if (!this.value.title) {
      alert('يرجى كتابة عنوان السلايدر الرئيسي');
      return;
    }

    if (this.isEditMode && this.currentSliderId !== null) {
      this.api.updateslider(this.currentSliderId, this.value).subscribe({
        next: () => {
          this.loadSliders();
          this.closeModal();
        },
        error: (err) => console.error('خطأ في التعديل', err)
      });
    } else {
      this.api.addSliders(this.value).subscribe({
        next: () => {
          this.loadSliders();
          this.closeModal();
        },
        error: (err) => console.error('خطأ في الإضافة', err)
      });
    }
  }

  deleteSlider(id: number): void {
    if (confirm('هل أنت تأكد من رغبتك في حذف هذا السلايدر؟')) {
      this.api.deleteSlider(id).subscribe({
        next: () => this.loadSliders(),
        error: (err) => console.error('خطأ في الحذف', err)
      });
    }
  }
}
