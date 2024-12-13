import {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import usePaginatedList from "../hooks/usePaginatedList";
import usePagination from "../hooks/usePagination";

import EditIcon from "../assets/icons/edit.svg";
import DeleteIcon from "../assets/icons/delete.svg";
import ArrowLeftIcon from "../assets/icons/arrow_left.svg";
import ArrowRightIcon from "../assets/icons/arrow_right.svg";
import DoubleArrowLeftIcon from "../assets/icons/double_arrow_left.svg";
import DoubleArrowRightIcon from "../assets/icons/double_arrow_right.svg";
import SearchIcon from "../assets/icons/search.svg";

import "./AdminUI.css";

type TUserRole = "admin" | "member";

type TUser = {
  id: string;
  name: string;
  email: string;
  role: TUserRole;
  delete?: boolean;
};

const AdminUI = () => {
  const PAGE_SIZE = 10;

  const { paginatedList, updateList, updateCurrentPage } =
    usePaginatedList<TUser>({
      pageSize: PAGE_SIZE,
    });

  const {
    pagination,
    currentPage,
    goToPage,
    nextPage,
    previousPage,
    updateTotalItems,
    firstPage,
    lastPage,
    canGoNext,
    canGoPrev,
    canGoLast,
    canGoFirst,
  } = usePagination({ pageSize: PAGE_SIZE });

  const abortControllerRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [original, setOriginal] = useState<TUser[]>([]);

  const [list, setList] = useState<TUser[]>([]);
  const [searchText, setSearchText] = useState("");

  const [editIndex, setEditIndex] = useState(-1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TUserRole>("member");

  const selectedCount = useMemo(
    () => list.filter((item) => item.delete).length,
    [list]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(
        "https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json",
        { signal: abortController.signal }
      );

      if (!response.ok) {
        throw new Error(response.statusText || "Something went wrong!");
      }

      setOriginal(await response.json());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("Request aborted");
        return;
      }

      setError(
        err instanceof Error ? err.message : "Error while fetching the data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Abort on unmount
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (original) {
      updateList(original);
      updateTotalItems(original.length);
    }
  }, [original, updateList, updateTotalItems]);

  useEffect(() => {
    setSearchText("");
    updateCurrentPage(currentPage);
  }, [currentPage, updateCurrentPage]);

  const onSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchText(event.target.value);
    },
    [setSearchText]
  );

  const onSearchIconClick = useCallback(() => {
    setList(
      [...original].filter(
        (item) =>
          item.email.toLowerCase().includes(searchText.toLowerCase()) ||
          item.name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [original, searchText]);

  const onCheckboxClick = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const id = event.target.getAttribute("data-checkbox-id");
      if (!id) return;

      setOriginal((prev) =>
        prev.map((item, index) => {
          if (id === "all") {
            const isInCurrentPage =
              index >= (currentPage - 1) * PAGE_SIZE &&
              index < currentPage * PAGE_SIZE;
            return {
              ...item,
              delete: isInCurrentPage ? !item.delete : item.delete,
            };
          }

          return item.id === id ? { ...item, delete: !item.delete } : item;
        })
      );
    },
    [currentPage]
  );

  const onDeleteSelectedClick = useCallback(() => {
    setOriginal((prev) => prev.filter((item) => !item.delete));
  }, []);

  const onDeleteClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.getAttribute("data-delete-id");
    if (!id) return;

    setOriginal((prev) => prev.filter(({ id: itemId }) => itemId !== id));
  }, []);

  const onEditClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const id = event.currentTarget.getAttribute("data-edit-id");
      if (!id) return;

      const index = list.findIndex((item) => item.id === id);
      if (index < 0) return;

      const user = list[index];
      setEditIndex(index);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    },
    [list]
  );

  const onNameEdit = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const onEmailEdit = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const onRoleChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value as TUserRole);
  }, []);

  const onSaveClick = useCallback(() => {
    setOriginal((prev) =>
      prev.map((item, index) =>
        index === (currentPage - 1) * PAGE_SIZE + editIndex
          ? { ...item, name, role, email }
          : item
      )
    );

    setEditIndex(-1);
    setName("");
    setEmail("");
    setRole("member" as TUserRole);
  }, [currentPage, editIndex, email, name, role]);

  useEffect(() => {
    setList(paginatedList);
  }, [paginatedList]);

  return (
    <>
      <div className="table-filters">
        <button
          className="delete-selected"
          onClick={onDeleteSelectedClick}
          disabled={selectedCount === 0}
        >
          Delete Selected
        </button>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            onChange={onSearch}
            value={searchText}
          />
          <button onClick={onSearchIconClick}>
            <img src={SearchIcon} alt="search icon" className="search-icon" />
          </button>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  data-checkbox-id="all"
                  onChange={onCheckboxClick}
                  checked={list.length > 0 && list.every((item) => item.delete)}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="table-no-data">
                  Loading
                </td>
              </tr>
            )}

            {!loading &&
              list.length > 0 &&
              list.map((item, index) => (
                <tr key={item.id} className={item.delete ? "selected" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      data-checkbox-id={item.id}
                      onChange={onCheckboxClick}
                      checked={!!item.delete}
                    />
                  </td>
                  <td>
                    {editIndex === index ? (
                      <input type="text" value={name} onChange={onNameEdit} />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <input
                        type="text"
                        value={email}
                        data-edit-field="name"
                        onChange={onEmailEdit}
                      />
                    ) : (
                      item.email
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <select
                        value={role}
                        data-edit-field="role"
                        onChange={onRoleChange}
                      >
                        <option value="admin">ADMIN</option>
                        <option value="member">MEMBER</option>
                      </select>
                    ) : (
                      item.role
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <button
                        className="icon table-action save"
                        data-save-id={item.id}
                        onClick={onSaveClick}
                      >
                        Save
                      </button>
                    ) : (
                      <>
                        <button
                          className="icon table-action edit"
                          data-edit-id={item.id}
                          onClick={onEditClick}
                        >
                          <img src={EditIcon} alt="edit icon" />
                        </button>
                        <button
                          className="icon table-action delete"
                          data-delete-id={item.id}
                          onClick={onDeleteClick}
                        >
                          <img src={DeleteIcon} alt="delete icon" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

            {!loading && searchText.length > 0 && list.length === 0 && (
              <tr>
                <td colSpan={5} className="table-no-data">
                  No results based on the search
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr className="table-no-data">
                <td colSpan={5}>{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-container">
        <div className="pagination">
          <button
            className="icon pagination first-page"
            disabled={!canGoFirst}
            onClick={firstPage}
          >
            <img src={DoubleArrowLeftIcon} alt="double arrow left icon" />
          </button>
          <button
            className="icon pagination previous-page"
            disabled={!canGoPrev}
            onClick={previousPage}
          >
            <img src={ArrowLeftIcon} alt="arrow left icon" />
          </button>
          {pagination.map(({ value, isSelected }, index) => (
            <button
              key={index}
              className={`pagination ${isSelected ? "highlight" : ""}`}
              onClick={() => typeof value === "number" && goToPage(value)}
              disabled={isSelected}
            >
              {value}
            </button>
          ))}
          <button
            className="icon pagination next-page"
            disabled={!canGoNext}
            onClick={nextPage}
          >
            <img src={ArrowRightIcon} alt="arrow right icon" />
          </button>
          <button
            className="icon pagination last-page"
            disabled={!canGoLast}
            onClick={lastPage}
          >
            <img src={DoubleArrowRightIcon} alt="double arrow right icon" />
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminUI;
