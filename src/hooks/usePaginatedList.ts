import { useCallback, useMemo, useState } from "react";

const usePaginatedList = <T>({
  list = [],
  pageSize: initialPageSize = 10,
  initialPage = 1,
}: {
  list?: T[];
  pageSize?: number;
  initialPage?: number;
} = {}) => {
  const [original, setOriginal] = useState(list);
  const [currentPage, setCurrentPage] = useState(initialPage - 1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const updateList = useCallback((original: T[]) => {
    setOriginal(original);
  }, []);

  const updatePageSize = useCallback((pageSize: number) => {
    setPageSize(pageSize);
  }, []);

  const updateCurrentPage = useCallback((page: number) => {
    setCurrentPage(page - 1);
  }, []);

  const paginatedList = useMemo(() => {
    return [...original].slice(
      currentPage * pageSize,
      (currentPage + 1) * pageSize
    );
  }, [currentPage, original, pageSize]);

  return { updateList, updatePageSize, updateCurrentPage, paginatedList };
};

export default usePaginatedList;
