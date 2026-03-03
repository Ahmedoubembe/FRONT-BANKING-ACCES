import { Routes } from '@angular/router';
import { RequestListComponent } from './request-list/request-list.component';
import { RequestDetailComponent } from './request-detail/request-detail.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: RequestListComponent, canActivate: [authGuard] },
  { path: 'request/:id', component: RequestDetailComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
