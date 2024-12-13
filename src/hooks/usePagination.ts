import { useCallback, useMemo, useState } from "react";

const range = (start: number, end: number) => {
  if (start > end) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const usePagination = ({
  totalItems = 0,
  pageSize: initialPageSize = 10,
  initialPage = 1,
}: {
  totalItems?: number;
  pageSize?: number;
  initialPage?: number;
}) => {
  const boundaryCount = 1; // Pages to show at boundaries
  const siblingCount = 1; // Pages to show around the current page

  const [currentPage, setCurrentPage] = useState(Math.max(initialPage, 1));
  const [total, setTotal] = useState(totalItems);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / pageSize), 1),
    [total, pageSize]
  );

  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  const updateTotalItems = useCallback((totalItems: number) => {
    setTotal(totalItems);
  }, []);

  const updatePageSize = useCallback((pageSize: number) => {
    setPageSize(pageSize);
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (canGoNext) setCurrentPage((prev) => prev + 1);
  }, [canGoNext]);

  const previousPage = useCallback(() => {
    if (canGoPrev) setCurrentPage((prev) => prev - 1);
  }, [canGoPrev]);

  const firstPage = useCallback(() => setCurrentPage(1), []);
  const lastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  const startPages = useMemo(
    () => range(1, Math.min(boundaryCount, totalPages)),
    [totalPages]
  );

  const endPages = useMemo(
    () =>
      range(
        Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
        totalPages
      ),
    [totalPages]
  );

  const siblingsStart = useMemo(
    () =>
      Math.max(
        Math.min(
          currentPage - siblingCount,
          totalPages - boundaryCount - siblingCount * 2 - 1
        ),
        boundaryCount + 1
      ),
    [currentPage, totalPages]
  );

  const siblingsEnd = useMemo(
    () =>
      Math.min(
        Math.max(
          currentPage + siblingCount,
          boundaryCount + siblingCount * 2 + 2
        ),
        totalPages - boundaryCount
      ),
    [currentPage, totalPages]
  );

  const pagination = useMemo(() => {
    return [
      ...startPages.map((page) => ({
        value: page,
        isSelected: page === currentPage,
      })),
      ...(siblingsStart > boundaryCount + 1
        ? [{ value: "...", isSelected: false }]
        : []),
      ...range(siblingsStart, siblingsEnd).map((page) => ({
        value: page,
        isSelected: page === currentPage,
      })),
      ...(siblingsEnd < totalPages - boundaryCount
        ? [{ value: "...", isSelected: false }]
        : []),
      ...endPages.map((page) => ({
        value: page,
        isSelected: page === currentPage,
      })),
    ];
  }, [
    currentPage,
    endPages,
    siblingsEnd,
    siblingsStart,
    startPages,
    totalPages,
  ]);

  return {
    pagination,
    currentPage,
    totalPages,
    goToPage,
    firstPage,
    lastPage,
    nextPage,
    previousPage,
    updateTotalItems,
    updatePageSize,
    canGoNext,
    canGoPrev,
    canGoLast: canGoNext,
    canGoFirst: canGoPrev,
  };
};

export default usePagination;
