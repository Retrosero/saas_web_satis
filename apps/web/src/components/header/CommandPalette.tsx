import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'lucide-react';
import { useCommandPalette } from '@/features/global-search/api';
import { useDebounce } from '@/lib/use-debounce';
import type { CommandDefinition } from '@saas/shared';

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 150);
  const { data: commands } = useCommandPalette();

  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); setOpen(true); } else if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);

  if (!commands) return null;
  const filtered = commands.filter((c: CommandDefinition) => !debounced || c.name.toLowerCase().includes(debounced.toLowerCase()) || (c.description ?? '').toLowerCase().includes(debounced.toLowerCase()));
  const byCat = filtered.reduce<Record<string, any[]>>((acc, c) => { (acc[c.category] ??= []).push(c); return acc; }, {});

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20" onClick={() => setOpen(false)}>
      <div className="w-[560px] max-h-[480px] overflow-hidden rounded-lg border border-outline bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3">
          <Command className="h-5 w-5 text-on-surface-variant" />
          <input autoFocus type="text" placeholder="Komut yaz... (örn: yeni satış)" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent text-base outline-none" />
          <kbd className="rounded bg-surface-variant px-1.5 py-0.5 text-xs">ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {Object.entries(byCat).map(([cat, cmds]) => (
            <div key={cat}>
              <div className="bg-surface-variant px-4 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{cat}</div>
              {cmds.map((c) => (
                <button key={c.code} onClick={() => { navigate(c.targetRoute); setOpen(false); setQuery(''); }} className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-surface-variant">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.icon ?? '⚡'}</span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.description && <p className="text-xs text-on-surface-variant">{c.description}</p>}
                    </div>
                  </div>
                  {c.shortcut && <kbd className="rounded bg-surface-variant px-2 py-0.5 text-xs">{c.shortcut}</kbd>}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-6 text-center text-sm text-on-surface-variant">Komut bulunamadı</div>}
        </div>
      </div>
    </div>
  );
}
