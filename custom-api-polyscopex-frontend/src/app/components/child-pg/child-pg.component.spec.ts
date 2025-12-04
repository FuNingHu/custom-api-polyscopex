import {ComponentFixture, TestBed} from '@angular/core/testing';
import {child-pgComponent} from "./child-pg.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('ChildPgComponent', () => {
  let fixture: ComponentFixture<ChildPgComponent>;
  let component: ChildPgComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChildPgComponent],
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader, useValue: {
            getTranslation(): Observable<Record<string, string>> {
              return of({});
            }
          }
        }
      })],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildPgComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
