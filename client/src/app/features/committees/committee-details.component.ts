import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CommitteeDetailsDto, CouncilApiService } from '../../council-api.service';

@Component({ selector: 'app-committee-details', standalone: true, imports: [DatePipe], templateUrl: './committee-details.component.html', styleUrl: './committee-details.component.scss' })
export class CommitteeDetailsComponent implements OnChanges {
  private readonly api = inject(CouncilApiService);
  @Input({ required: true }) committeeId!: number;
  protected details: CommitteeDetailsDto | null = null;
  protected loading = true;
  ngOnChanges(changes: SimpleChanges): void { if (changes['committeeId']) this.load(); }
  private load(): void { this.loading = true; this.api.getCommittee(this.committeeId).subscribe({ next: (details) => { this.details = details; this.loading = false; }, error: () => { this.details = null; this.loading = false; } }); }
}
