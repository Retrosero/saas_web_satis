import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, X } from 'lucide-react';
import { useGlobalSearch, useSearchHistory } from '@/features/global-search/api';
import { useSearch as useMeiliSearch } from '@/features/search/api';
import { useDebounce } from '@/lib/use-debounce';

export function GlobalSearchBar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const { data: meiliData } = useMeiliSearch(debounced, 5);
  const { data: prismaData } = useGlobalSearch(debounced, 5);
  const { data: history } = useSearchHistory(5);
  const data = meiliData ?? prismaData;
  const results = data?.results ?? [];
  const byModule = data?.byModule ?? {};
  const safeHistory = history ?? [];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-outline bg-surface px-3 py-1.5">
        <Search className="h-4 w-4 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Ara: cari, ürün, satış, teklif, sipariş, kullanıcı..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-72 bg-transparent text-sm outline-none placeholder:text-on-surface-variant"
        />
        <kbd className="rounded bg-surface-variant px-1.5 py-0.5 text-xs text-on-surface-variant">Ctrl K</kbd>
        {query && (
          <button onClick={() => setQuery('')} className="rounded p-0.5 hover:bg-surface-variant">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (debounced.length >= 2 || safeHistory.length > 0) && (
        <div className="absolute right-0 z-50 mt-1 max-h-[480px] w-[420px] overflow-y-auto rounded-md border border-outline bg-surface shadow-lg">
          {!data && debounced.length >= 2 && <div className="p-4 text-sm text-on-surface-variant">Aranıyor...</div>}
          {data && results.length === 0 && debounced.length >= 2 && (
            <div className="p-4 text-sm text-on-surface-variant">Sonuç bulunamadı</div>
          )}
          {data &&
            Object.entries(byModule).map(([mod, items]) => (
              <div key={mod} className="border-b border-outline-variant last:border-0">
                <div className="bg-surface-variant px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {mod}
                </div>
                {(items as any[]).map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => {
                      navigate(r.link);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-variant"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="truncate text-xs text-on-surface-variant">{r.description}</p>
                    </div>
                    {r.status && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{r.status}</span>}
                  </button>
                ))}
              </div>
            ))}
          {debounced.length < 2 && safeHistory.length > 0 && (
            <div>
              <div className="flex items-center gap-1 bg-surface-variant px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <Clock className="h-3 w-3" /> Son Aramalar
              </div>
              {safeHistory.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setQuery(h.query)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-surface-variant"
                >
                  {h.query}
                </button>
              ))}
            </div>
          )}
          {data && results.length > 0 && (
            <div className="border-t border-outline-variant bg-surface-variant px-3 py-1 text-xs text-on-surface-variant">
              {data.totalCount} sonuç ({data.durationMs}ms)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
