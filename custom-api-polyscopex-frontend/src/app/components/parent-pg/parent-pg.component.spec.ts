import {ComponentFixture, TestBed} from '@angular/core/testing';
import {parent-pgComponent} from "./parent-pg.component";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('ParentPgComponent', () => {
  let fixture: ComponentFixture<ParentPgComponent>;
  let component: ParentPgComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParentPgComponent],
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

    fixture = TestBed.createComponent(ParentPgComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
