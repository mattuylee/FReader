import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SheetPage } from './sheet.page';

describe('SheetPage', () => {
  let component: SheetPage;
  let fixture: ComponentFixture<SheetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SheetPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SheetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
