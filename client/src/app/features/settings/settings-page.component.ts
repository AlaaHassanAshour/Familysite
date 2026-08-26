import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, SiteSettingsDto } from '../../council-api.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit {
  private readonly api = inject(CouncilApiService);

  isLoading = signal(true);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);

  model: SiteSettingsDto = {
    familyName: 'عائلة عاشور',
    councilName: 'مجلس عائلة عاشور',
    welcomeMessage: '',
    heroSubtitle: '',
    visionText: '',
    phone: '',
    email: '',
    address: ''
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.api.getSettings().subscribe({
      next: (data) => {
        if (data) this.model = { ...this.model, ...data };
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  save() {
    this.isSaving.set(true);
    this.successMessage.set(null);
    this.api.updateSettings(this.model).subscribe({
      next: (updated) => {
        this.model = updated;
        this.isSaving.set(false);
        this.successMessage.set('تم حفظ وتحديث إعدادات الموقع بنجاح');
      },
      error: () => {
        this.isSaving.set(false);
        alert('حدث خطأ أثناء حفظ الإعدادات');
      }
    });
  }
}
