import { Routes } from '@angular/router';
import { RequestListComponent } from './request-list/request-list.component';
import { RequestDetailComponent } from './request-detail/request-detail.component';

export const routes: Routes = [
  { path: '', component: RequestListComponent },
  { path: 'request/:id', component: RequestDetailComponent }
];
