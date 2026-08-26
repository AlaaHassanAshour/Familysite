import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Addcommittees } from './addcommittees';

describe('Addcommittees', () => {
  let component: Addcommittees;
  let fixture: ComponentFixture<Addcommittees>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Addcommittees]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Addcommittees);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
