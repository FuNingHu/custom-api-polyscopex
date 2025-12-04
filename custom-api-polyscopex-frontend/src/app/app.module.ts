import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { ParentPgComponent } from './components/parent-pg/parent-pg.component';
import { ChildPgComponent } from './components/child-pg/child-pg.component';

import { UIAngularComponentsModule } from '@universal-robots/ui-angular-components';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { HttpBackend, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {MultiTranslateHttpLoader} from 'ngx-translate-multi-http-loader';
import { PATH } from '../generated/contribution-constants';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';

export const httpLoaderFactory = (http: HttpBackend) =>
    new MultiTranslateHttpLoader(http, [
      { prefix: PATH + '/assets/i18n/', suffix: '.json' },
      { prefix: './ui/assets/i18n/', suffix: '.json' },
    ]);

@NgModule({

  declarations: [
      ParentPgComponent,
      ChildPgComponent
],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      UIAngularComponentsModule,
      HttpClientModule,
      FormsModule,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useFactory: httpLoaderFactory, deps: [HttpBackend] },
        useDefaultLang: false,
      })
    ],
    providers: [],
})

export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const parentpgComponent = createCustomElement(ParentPgComponent, {injector: this.injector});
    customElements.define('funh-custom-api-polyscopex-parent-pg', parentpgComponent);
    const childpgComponent = createCustomElement(ChildPgComponent, {injector: this.injector});
    customElements.define('funh-custom-api-polyscopex-child-pg', childpgComponent);
  }

  // This function is never called, because we don't want to actually use the workers, just tell webpack about them
  registerWorkersWithWebPack() {
    new Worker(new URL('./components/parent-pg/parent-pg.behavior.worker.ts'
        /* webpackChunkName: "parent-pg.worker" */, import.meta.url), {
      name: 'parent-pg',
      type: 'module'
    });new Worker(new URL('./components/child-pg/child-pg.behavior.worker.ts'
        /* webpackChunkName: "child-pg.worker" */, import.meta.url), {
      name: 'child-pg',
      type: 'module'
    });
  }
}

