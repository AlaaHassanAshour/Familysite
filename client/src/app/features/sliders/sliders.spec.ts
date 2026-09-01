import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sliders } from './sliders';

describe('Sliders', () => {
  let component: Sliders;
  let fixture: ComponentFixture<Sliders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sliders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sliders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
