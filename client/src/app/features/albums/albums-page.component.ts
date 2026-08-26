import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, MediaAlbumDto, MediaItemDto } from '../../council-api.service';

@Component({
  selector: 'app-albums-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './albums-page.component.html',
  styleUrl: './albums-page.component.scss'
})
export class AlbumsPageComponent implements OnInit {
  readonly api = inject(CouncilApiService);

  albums = signal<MediaAlbumDto[]>([]);
  selectedAlbum = signal<MediaAlbumDto | null>(null);
  isLoading = signal(true);
  isUploading = signal(false);

  // Modals
  showCreateModal = signal(false);
  showUploadModal = signal(false);
  previewMedia = signal<MediaItemDto | null>(null);

  newAlbum = {
    title: '',
    description: '',
    coverImageUrl: '',
    eventDate: ''
  };

  ngOnInit() {
    this.loadAlbums();
  }

  loadAlbums() {
    this.isLoading.set(true);
    this.api.getAlbums().subscribe({
      next: (data) => {
        this.albums.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.newAlbum = { title: '', description: '', coverImageUrl: '', eventDate: '' };
    this.showCreateModal.set(true);
  }

  submitCreateAlbum() {
    if (!this.newAlbum.title.trim()) {
      alert('يرجى إدخال عنوان الألبوم');
      return;
    }

    this.api.createAlbum({
      title: this.newAlbum.title.trim(),
      description: this.newAlbum.description.trim() || undefined,
      coverImageUrl: this.newAlbum.coverImageUrl || undefined,
      eventDate: this.newAlbum.eventDate ? new Date(this.newAlbum.eventDate).toISOString() : undefined
    }).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadAlbums();
      }
    });
  }

  viewAlbumDetails(albumId: number) {
    this.api.getAlbum(albumId).subscribe((album) => {
      this.selectedAlbum.set(album);
    });
  }

  backToAlbums() {
    this.selectedAlbum.set(null);
    this.loadAlbums();
  }

  onMultiUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const album = this.selectedAlbum();
    if (!album) return;

    const files = Array.from(input.files);
    this.isUploading.set(true);

    this.api.uploadMultiple(files, 'albums').subscribe({
      next: (uploadedItems) => {
        const mediaPayload = uploadedItems.map(item => ({
          filePath: item.url,
          mediaType: item.mediaType,
          title: item.fileName,
          fileSize: item.fileSize
        }));

        this.api.addMediaItemsToAlbum(album.id, mediaPayload).subscribe({
          next: () => {
            this.isUploading.set(false);
            this.viewAlbumDetails(album.id);
          },
          error: () => {
            this.isUploading.set(false);
            alert('حدث خطأ أثناء حفظ وسائط الألبوم');
          }
        });
      },
      error: () => {
        this.isUploading.set(false);
        alert('حدث خطأ أثناء رفع الملفات على السيرفر');
      }
    });
  }

  deleteItem(mediaId: number) {
    const album = this.selectedAlbum();
    if (!album) return;

    if (!confirm('هل تريد بالتأكيد حذف هذا الملف من الألبوم؟')) return;

    this.api.deleteMediaItem(album.id, mediaId).subscribe({
      next: () => this.viewAlbumDetails(album.id)
    });
  }

  deleteAlbum(albumId: number, event: Event) {
    event.stopPropagation();
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الألبوم بكافة محتوياته؟')) return;

    this.api.deleteAlbum(albumId).subscribe({
      next: () => {
        if (this.selectedAlbum()?.id === albumId) {
          this.selectedAlbum.set(null);
        }
        this.loadAlbums();
      }
    });
  }
}
