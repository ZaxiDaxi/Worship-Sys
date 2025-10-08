import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}) => {
  return (
    <div className="flex justify-center items-center mt-6 space-x-4">
      <button
        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        onClick={onPrevious}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
