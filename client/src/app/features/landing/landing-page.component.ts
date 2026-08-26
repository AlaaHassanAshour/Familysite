import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  CouncilApiService,
  CommitteeDto,
  CommitteeDetailsDto,
  ActivityDto,
  MediaAlbumDto,
  UpcomingEventDto,
  DecisionDto,
  MemberDto,
  SiteSettingsDto
} from '../../council-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  readonly api = inject(CouncilApiService);
  readonly auth = inject(AuthService);

  // Data Signals
  settings = signal<SiteSettingsDto | null>(null);
  committees = signal<CommitteeDto[]>([]);
  latestActivities = signal<ActivityDto[]>([]);
  albums = signal<MediaAlbumDto[]>([]);
  upcomingEvents = signal<UpcomingEventDto[]>([]);
  decisions = signal<DecisionDto[]>([]);
  branches = signal<any[]>([]);
  members = signal<MemberDto[]>([]);
  councilLeaders = signal<MemberDto[]>([]);

  // Hero Slider
  currentSlide = signal(0);
  sliderTimer: any;

  slides = [
    {
      title: 'مجلس وديوان عائلة عاشور الرسمي',
      subtitle: 'أصالة، ترابط وتكافل، وبناء مستقبل مشرق لأبناء العائلة الكرام',
      badge: 'المنصة الرسمية المعتمدة',
      bgClass: 'slide-1',
      ctaText: 'استكشف شجرة العائلة',
      ctaTarget: '#tree-section'
    },
    {
      title: 'مبادرات التكافل وصندوق العائلة',
      subtitle: 'ترسيخ قيم التعاضد والتراحم ودعم المتعففين وتمكين شباب العائلة',
      badge: 'تكافل وعطاء',
      bgClass: 'slide-2',
      ctaText: 'الأنشطة والفعاليات',
      ctaTarget: '#activities-section'
    },
    {
      title: 'توثيق الأنساب والفروع الستة الكبرى',
      subtitle: 'شجرة نسب متصلة وسجل مدني شامل لكافة أبناء العائلة في الوطن والمهجر',
      badge: 'هوية وتاريخ عريق',
      bgClass: 'slide-3',
      ctaText: 'قرارات المجلس',
      ctaTarget: '#decisions-section'
    }
  ];

  // Interactive Modals
  selectedCommitteeDetails = signal<CommitteeDetailsDto | null>(null);
  isLoadingCommittee = signal(false);

  selectedAlbumDetails = signal<MediaAlbumDto | null>(null);
  activeMediaIndex = signal(0);

  // Search in Directory
  searchQuery = '';
  selectedBranchFilter: number | null = null;

  ngOnInit() {
    this.startSlider();
    this.loadLandingData();
  }

  ngOnDestroy() {
    if (this.sliderTimer) clearInterval(this.sliderTimer);
  }

  private startSlider() {
    this.sliderTimer = setInterval(() => {
      this.currentSlide.update(i => (i + 1) % this.slides.length);
    }, 6000);
  }

  setSlide(index: number) {
    this.currentSlide.set(index);
    if (this.sliderTimer) {
      clearInterval(this.sliderTimer);
      this.startSlider();
    }
  }

  prevSlide() {
    this.currentSlide.update(i => (i === 0 ? this.slides.length - 1 : i - 1));
  }

  nextSlide() {
    this.currentSlide.update(i => (i + 1) % this.slides.length);
  }

  loadLandingData() {
    // 1. Settings
    this.api.getSettings().subscribe(s => this.settings.set(s));

    // 2. Committees
    this.api.getCommittees().subscribe(c => this.committees.set(c));

    // 3. Latest 4 Activities
    this.api.getActivities(4).subscribe(a => this.latestActivities.set(a));

    // 4. Albums
    this.api.getAlbums().subscribe(al => this.albums.set(al));

    // 5. Upcoming Events
    this.api.getUpcomingEvents(true).subscribe(ev => this.upcomingEvents.set(ev));

    // 6. Decisions
    this.api.getDecisions().subscribe(d => this.decisions.set(d as DecisionDto[]));

    // 7. Branches & Council Leaders
    this.api.getBranches().subscribe(b => this.branches.set(b));
    this.api.getMembers({ isCouncilOnly: true }).subscribe(m => this.councilLeaders.set(m));
    this.api.getMembers().subscribe(m => this.members.set(m));
  }

  // Committee Interactive Modal
  openCommitteeModal(committeeId: number) {
    this.isLoadingCommittee.set(true);
    this.selectedCommitteeDetails.set(null);
    this.api.getCommittee(committeeId).subscribe({
      next: (details) => {
        this.selectedCommitteeDetails.set(details);
        this.isLoadingCommittee.set(false);
      },
      error: () => this.isLoadingCommittee.set(false)
    });
  }

  closeCommitteeModal() {
    this.selectedCommitteeDetails.set(null);
  }

  // Album Lightbox Modal
  openAlbumLightbox(albumId: number) {
    this.activeMediaIndex.set(0);
    this.api.getAlbum(albumId).subscribe(album => {
      this.selectedAlbumDetails.set(album);
    });
  }

  closeAlbumLightbox() {
    this.selectedAlbumDetails.set(null);
  }

  nextMedia() {
    const album = this.selectedAlbumDetails();
    if (!album?.items?.length) return;
    this.activeMediaIndex.update(i => (i + 1) % album.items!.length);
  }

  prevMedia() {
    const album = this.selectedAlbumDetails();
    if (!album?.items?.length) return;
    this.activeMediaIndex.update(i => (i === 0 ? album.items!.length - 1 : i - 1));
  }

  // Filtered members for public search
  get filteredMembers(): MemberDto[] {
    return this.members().filter(m => {
      const matchBranch = !this.selectedBranchFilter || m.branchId === Number(this.selectedBranchFilter);
      const matchQuery = !this.searchQuery.trim() ||
        m.fullName.toLowerCase().includes(this.searchQuery.trim().toLowerCase()) ||
        (m.nationalId && m.nationalId.includes(this.searchQuery.trim()));
      return matchBranch && matchQuery;
    }).slice(0, 12);
  }

  scrollTo(elementId: string) {
    const el = document.querySelector(elementId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}
