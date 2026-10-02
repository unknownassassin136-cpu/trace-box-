import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-audit-ledger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">Cryptographic Audit Ledger</h1>
          <p class="text-slate-400 text-sm">Immutable SHA-256 chain of custody for all critical events</p>
        </div>
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-file-export"></i> Export PDF Report
        </button>
      </div>

      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <div class="p-4 border-b border-slate-700 bg-slate-900/30 flex gap-4">
          <input type="text" placeholder="Search hash, shipment, or device..." class="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm w-96 focus:outline-none focus:border-indigo-500">
        </div>
        
        <div *ngIf="isLoading" class="text-center py-12">
          <i class="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
          <p class="text-slate-400">Verifying ledger entries...</p>
        </div>

        <div *ngIf="!isLoading && ledgerEntries.length === 0" class="text-center py-12 bg-slate-800/50">
          <i class="fas fa-shield-alt text-6xl text-slate-600 mb-4"></i>
          <p class="text-slate-400">No cryptographic events recorded yet.</p>
        </div>

        <div class="overflow-x-auto" *ngIf="!isLoading && ledgerEntries.length > 0">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900/50 text-slate-400 uppercase text-xs">
              <tr>
                <th class="px-6 py-4">Seq</th>
                <th class="px-6 py-4">Timestamp</th>
                <th class="px-6 py-4">Event Type</th>
                <th class="px-6 py-4">Device ID</th>
                <th class="px-6 py-4">SHA-256 Hash Signature</th>
                <th class="px-6 py-4">Integrity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700 font-mono text-xs">
              <tr *ngFor="let entry of ledgerEntries" class="hover:bg-slate-700/30 transition-colors">
                <td class="px-6 py-4 text-white">#{{ entry.seq }}</td>
                <td class="px-6 py-4">{{ entry.timestamp | date:'medium' }}</td>
                <td class="px-6 py-4 font-sans">
                  <span class="px-2 py-1 rounded text-xs font-bold"
                    [ngClass]="entry.type === 'TAMPER' ? 'bg-red-500/20 text-red-400' : (entry.type === 'TEMP_BREACH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400')">
                    {{ entry.type }}
                  </span>
                </td>
                <td class="px-6 py-4">{{ entry.device }}</td>
                <td class="px-6 py-4 text-slate-500 truncate max-w-xs" [title]="entry.hash">
                  {{ entry.hash.substring(0, 32) }}...
                </td>
                <td class="px-6 py-4 font-sans">
                  <span class="text-green-400 flex items-center gap-1"><i class="fas fa-check-circle"></i> Valid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AuditLedgerComponent implements OnInit {
  ledgerEntries: any[] = [];
  isLoading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('/ledger').subscribe({
      next: (res) => {
        this.ledgerEntries = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load ledger', err);
        this.isLoading = false;
      }
    });
  }
}
