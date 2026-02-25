"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface SearchResult {
  url: string;
  meta: { title: string };
  excerpt: string;
}

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagefind, setPagefind] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load pagefind
  useEffect(() => {
    async function loadPagefind() {
      if (typeof window !== "undefined") {
        try {
          // @ts-ignore
          const pf = await import(/* webpackIgnore: true */ "/pagefind/pagefind.js");
          setPagefind(pf);
        } catch (e) {
          console.log("Pagefind not available (run build first)");
        }
      }
    }
    loadPagefind();
  }, []);

  // Handle keyboard shortcut
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

  // Search
  const search = useCallback(
    async (q: string) => {
      if (!pagefind || !q) {
        setResults([]);
        return;
      }
      const searchResults = await pagefind.search(q);
      const data = await Promise.all(
        searchResults.results.slice(0, 5).map((r: any) => r.data())
      );
      setResults(data);
    },
    [pagefind]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <>
      {/* Search button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-1.5 text-xs text-gray-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative min-h-screen flex items-start justify-center p-4 pt-[15vh]">
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
              {/* Search input */}
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="w-full bg-transparent py-4 px-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                <kbd className="rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <ul className="max-h-80 overflow-y-auto py-2">
                  {results.map((result, i) => (
                    <li key={i}>
                      <button
                        onClick={() => handleSelect(result.url)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 focus:outline-none"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.meta.title}
                        </div>
                        <div
                          className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: result.excerpt }}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* No results */}
              {query && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </div>
              )}

              {/* Empty state */}
              {!query && (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
