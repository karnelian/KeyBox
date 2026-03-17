import { useState, useCallback } from "react";
import { useSecretStore } from "@/stores/secretStore";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const { setFilter } = useSecretStore();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setFilter({ query: value || undefined });
    },
    [setFilter]
  );

  return (
    <div className="flex-1 relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        🔍
      </span>
      <input
        id="search-input"
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="시크릿 검색 (Ctrl+F)"
        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
