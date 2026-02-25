"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  url: string;
  meta?: { title?: string };
  excerpt?: string;
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagefind, setPagefind] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load pagefind
  useEffect(() => {
    async function loadPagefind() {
      if (typeof window !== "undefined") {
        try {
          const pf = await import(
            /* webpackIgnore: true */ "/pagefind/pagefind.js"
          );
          setPagefind(pf);
        } catch (e) {
          console.log("Pagefind not available (run build first)");
        }
      }
    }
    loadPagefind();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const search = useCallback(
    async (searchQuery: string) => {
      if (!pagefind || !searchQuery) {
        setResults([]);
        return;
      }
      const searchResults = await pagefind.search(searchQuery);
      const data = await Promise.all(
        searchResults.results.slice(0, 8).map((r: any) => r.data())
      );
      setResults(data);
      setSelectedIndex(0);
    },
    [pagefind]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(result.url);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigateToResult(results[selectedIndex]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] text-gray-500 dark:text-gray-400">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-4">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-4 text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <kbd className="rounded border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-2">
            {results.map((result, index) => (
              <li key={result.url}>
                <button
                  onClick={() => navigateToResult(result)}
                  className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-brand-50 dark:bg-brand-900/20 text-brand-900 dark:text-brand-100"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.meta?.title || result.url}
                  </div>
                  {result.excerpt && (
                    <div
                      className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: result.excerpt }}
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* No results */}
        {query && results.length === 0 && pagefind && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* No pagefind */}
        {!pagefind && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Search index not available. Run <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">npm run build</code> first.
          </div>
        )}
      </div>
    </div>
  );
}
