import { useState, useMemo } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiCheck } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';

function SkeletonRow({ columns }) {
  return (
    <tr className="animate-pulse">
      {columns.map((col, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-4 bg-secondary-200 rounded ${col.width ? `w-${col.width}` : 'w-full'}`} />
        </td>
      ))}
    </tr>
  );
}

function EmptyState({ columns, message, icon: Icon }) {
  return (
    <tr>
      <td colSpan={columns.length} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center">
          {Icon && <Icon className="w-12 h-12 text-secondary-300 mb-3" />}
          <p className="text-secondary-500">{message || 'No data available'}</p>
        </div>
      </td>
    </tr>
  );
}

export default function DataTable({
  columns,
  data,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue = '',
  pagination = false,
  pageSize = 10,
  totalItems,
  currentPage: controlledPage,
  onPageChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  actions,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon,
  sortable = true,
  onRowClick,
}) {
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [internalSelected, setInternalSelected] = useState([]);

  const debouncedSearch = useDebounce(internalSearch, 300);

  const isControlled = searchValue !== undefined;
  const search = isControlled ? searchValue : debouncedSearch;
  const setSearch = isControlled ? onSearch : setInternalSearch;

  const page = controlledPage || internalPage;
  const setPage = onPageChange || setInternalPage;

  const selected = selectedIds || internalSelected;
  const setSelected = onSelectionChange || setInternalSelected;

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : null;
        return val != null ? String(val).toLowerCase().includes(lower) : false;
      }),
    );
  }, [data, search, columns]);

  const sortedData = useMemo(() => {
    if (!sortField || !sortable) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortField, sortDirection, sortable]);

  const totalPages = pagination
    ? Math.ceil((totalItems || sortedData.length) / pageSize)
    : 1;

  const paginatedData = pagination
    ? sortedData.slice((page - 1) * pageSize, page * pageSize)
    : sortedData;

  const handleSort = (field) => {
    if (!sortable) return;
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selected.length === paginatedData.length) {
      setSelected([]);
    } else {
      setSelected(paginatedData.map((row) => row.id));
    }
  };

  const handleSelectRow = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  if (loading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-secondary-200">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary-50">
              {selectable && <th className="w-10 px-4 py-3" />}
              {columns.map((col) => (
                <th key={col.accessor || col.header} className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && <th className="w-20 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: pageSize }).map((_, i) => (
              <SkeletonRow key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-secondary-200">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary-50">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <button onClick={handleSelectAll} className="p-0.5 rounded hover:bg-secondary-200 transition-colors">
                    <FiCheck className={`w-4 h-4 ${selected.length === paginatedData.length && paginatedData.length > 0 ? 'text-primary-600' : 'text-secondary-400'}`} />
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                  className={`px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider ${
                    col.sortable !== false && col.accessor && sortable ? 'cursor-pointer hover:bg-secondary-100 select-none' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.accessor && sortable && sortField === col.accessor && (
                      sortDirection === 'asc' ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="w-20 px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {paginatedData.length === 0 ? (
              <EmptyState columns={selectable || actions ? columns.length + 1 : columns.length} message={emptyMessage} icon={EmptyIcon} />
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`${
                    selected.includes(row.id) ? 'bg-primary-50' : 'hover:bg-secondary-50'
                  } ${onRowClick ? 'cursor-pointer' : ''} transition-colors`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); handleSelectRow(row.id); }} className="p-0.5 rounded hover:bg-secondary-200 transition-colors">
                        <FiCheck className={`w-4 h-4 ${selected.includes(row.id) ? 'text-primary-600' : 'text-secondary-300'}`} />
                      </button>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.accessor || col.header} className="px-4 py-3 text-sm text-secondary-700 whitespace-nowrap">
                      {col.cell ? col.cell(row) : col.accessor ? row[col.accessor] : null}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        {typeof actions === 'function' ? actions(row) : actions}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems || sortedData.length)} of {totalItems || sortedData.length}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-secondary-300 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 hover:bg-secondary-50 border border-secondary-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-secondary-300 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
