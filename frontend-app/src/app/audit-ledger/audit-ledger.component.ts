import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
        
        <div class="overflow-x-auto">
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
                <td class="px-6 py-4">{{ entry.timestamp }}</td>
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
export class AuditLedgerComponent {
  ledgerEntries = [
    { seq: 1042, timestamp: '2026-09-26 13:42:01', type: 'TAMPER', device: 'NODE-DEMO-01', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { seq: 1041, timestamp: '2026-09-26 12:15:30', type: 'TEMP_BREACH', device: 'NODE-DEMO-01', hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' },
    { seq: 1040, timestamp: '2026-09-26 08:00:00', type: 'DISPATCH', device: 'NODE-DEMO-01', hash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' },
    { seq: 1039, timestamp: '2026-09-25 18:30:12', type: 'ARRIVAL', device: 'NODE-DEMO-02', hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4' },
    { seq: 1038, timestamp: '2026-09-25 09:14:55', type: 'DISPATCH', device: 'NODE-DEMO-02', hash: '9283e07d0f1712a4d048d28c34796fb82601c7fb880bb661005a805096b797fc' },
  ];
}
