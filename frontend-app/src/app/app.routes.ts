import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ShipmentsComponent } from './shipments/shipments.component';
import { DevicesComponent } from './devices/devices.component';
import { AuditLedgerComponent } from './audit-ledger/audit-ledger.component';
import { TrackingComponent } from './tracking/tracking.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'app', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'tracking', component: TrackingComponent },
      { path: 'shipments', component: ShipmentsComponent },
      { path: 'devices', component: DevicesComponent },
      { path: 'audit-ledger', component: AuditLedgerComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
