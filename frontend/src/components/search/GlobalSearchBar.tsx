import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Users, Building2, FolderKanban, CheckSquare, X, ArrowRight } from 'lucide-react';
import { searchApi } from '../../api/search';
import { SearchItem, SearchResultsCategory } from '../../types/search';

export const GlobalSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResultsCategory | null>(null);
  const [total, setTotal] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search API request
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    searchApi
      .search(debouncedQuery, 5)
      .then((res) => {
        if (isMounted) {
          setResults(res.results);
          setTotal(res.total);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResults(null);
          setTotal(0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (item: SearchItem) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.url);
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'employee':
        return <Users className="w-3.5 h-3.5 text-brand-600" />;
      case 'department':
        return <Building2 className="w-3.5 h-3.5 text-indigo-600" />;
      case 'project':
        return <FolderKanban className="w-3.5 h-3.5 text-amber-600" />;
      case 'task':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Search className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search employees, tasks, projects..."
          className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-hidden font-medium"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults(null);
            }}
            className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown Popover */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 custom-scrollbar">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              <span>Searching directory & tasks...</span>
            </div>
          ) : total === 0 ? (
            <div className="py-8 text-center px-4">
              <Search className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No results found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No matching records for "{query}" in your company.
              </p>
            </div>
          ) : (
            <div className="py-2 divide-y divide-slate-100">
              {/* Employees */}
              {results?.employees && results.employees.length > 0 && (
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>Employees ({results.employees.length})</span>
                  </div>
                  {results.employees.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full px-3.5 py-2 text-left hover:bg-brand-50/50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {item.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results?.tasks && results.tasks.length > 0 && (
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3 text-slate-400" />
                    <span>Tasks ({results.tasks.length})</span>
                  </div>
                  {results.tasks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full px-3.5 py-2 text-left hover:bg-emerald-50/50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon('task')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Projects */}
              {results?.projects && results.projects.length > 0 && (
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FolderKanban className="w-3 h-3 text-slate-400" />
                    <span>Projects ({results.projects.length})</span>
                  </div>
                  {results.projects.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full px-3.5 py-2 text-left hover:bg-amber-50/50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon('project')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Departments */}
              {results?.departments && results.departments.length > 0 && (
                <div className="py-1">
                  <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Departments ({results.departments.length})</span>
                  </div>
                  {results.departments.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full px-3.5 py-2 text-left hover:bg-indigo-50/50 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          {getCategoryIcon('department')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
