import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchInput,
  onSearchInputChange,
  onSubmit,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center max-w-md bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
    >
      <input
        type="text"
        placeholder="Search songs..."
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        className="w-full px-4 py-2 focus:outline-none"
      />
      <button type="submit" className="px-4 py-2 bg-white text-grey-600 items-center justify-center">
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
};

export default SearchBar;
