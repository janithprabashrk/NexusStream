import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  TableColumn,
  Loading,
  Pagination,
  Input,
  Select,
  Button,
  Badge,
} from '@/components';
import { ordersApi } from '@/api';
import { OrderEvent, PartnerId, PaginatedResult, SortField, SortDirection } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<PaginatedResult<OrderEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [partnerId, setPartnerId] = useState<PartnerId | ''>((searchParams.get('partnerId') as PartnerId) || '');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [productId, setProductId] = useState(searchParams.get('productId') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>((searchParams.get('sortField') as SortField) || 'processedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>((searchParams.get('sortDirection') as SortDirection) || 'desc');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.getOrders({
        page, pageSize, partnerId: partnerId || undefined, customerId: customerId || undefined,
        productId: productId || undefined, field: sortField, direction: sortDirection,
      });
      setOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, partnerId, customerId, productId, sortField, sortDirection]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (partnerId) params.set('partnerId', partnerId);
    if (customerId) params.set('customerId', customerId);
    if (productId) params.set('productId', productId);
    if (page > 1) params.set('page', String(page));
    if (sortField !== 'processedAt') params.set('sortField', sortField);
    if (sortDirection !== 'desc') params.set('sortDirection', sortDirection);
    setSearchParams(params);
  }, [partnerId, customerId, productId, page, sortField, sortDirection, setSearchParams]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortDirection('desc');
    }
  };

  const handleClearFilters = () => { setPartnerId(''); setCustomerId(''); setProductId(''); setPage(1); };
  const hasActiveFilters = partnerId || customerId || productId;

  const columns: TableColumn<OrderEvent>[] = [
    { key: 'sequenceNumber', header: 'Seq #', sortable: true, width: '80px', render: (order: OrderEvent) => <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{order.sequenceNumber}</span> },
    { key: 'externalOrderId', header: 'Order ID', render: (order: OrderEvent) => <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{order.externalOrderId}</span> },
    { key: 'partnerId', header: 'Partner', render: (order: OrderEvent) => <Badge variant={order.partnerId === 'PARTNER_A' ? 'primary' : 'cyber'}>{order.partnerId === 'PARTNER_A' ? 'Partner A' : 'Partner B'}</Badge> },
    { key: 'customerId', header: 'Customer', render: (order: OrderEvent) => <span className="text-sm text-gray-600 dark:text-gray-300">{order.customerId}</span> },
    { key: 'productId', header: 'Product', render: (order: OrderEvent) => <span className="text-sm text-gray-600 dark:text-gray-300">{order.productId}</span> },
    { key: 'quantity', header: 'Qty', width: '60px', render: (order: OrderEvent) => <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-dark-600 text-sm font-medium text-gray-700 dark:text-gray-300">{order.quantity}</span> },
    { key: 'netAmount', header: 'Net Amount', sortable: true, render: (order: OrderEvent) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.netAmount)}</span> },
    { key: 'transactionTime', header: 'Transaction', sortable: true, render: (order: OrderEvent) => <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.transactionTime)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Manage and view all processed orders</p>
        </div>
        <Button onClick={() => navigate('/submit')} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>Submit Order</Button>
      </div>

      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <Select label="Partner" value={partnerId} onChange={(e) => { setPartnerId(e.target.value as PartnerId | ''); setPage(1); }} options={[{ value: '', label: 'All Partners' }, { value: 'PARTNER_A', label: 'Partner A' }, { value: 'PARTNER_B', label: 'Partner B' }]} />
            <Input label="Customer ID" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPage(1); }} placeholder="Filter by customer..." icon={<SearchIcon />} />
            <Input label="Product ID" value={productId} onChange={(e) => { setProductId(e.target.value); setPage(1); }} placeholder="Filter by product..." icon={<SearchIcon />} />
          </div>
          {hasActiveFilters && <div className="flex items-end"><Button variant="ghost" onClick={handleClearFilters}><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Clear</Button></div>}
        </div>
      </Card>

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0"><svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <div className="flex-1"><p className="font-medium text-red-600 dark:text-red-400">{error}</p></div>
            <Button variant="danger" size="sm" onClick={fetchOrders}>Retry</Button>
          </div>
        </Card>
      )}

      {loading && !orders && <div className="flex items-center justify-center py-12"><Loading size="lg" text="Loading orders..." /></div>}

      {orders && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">Showing <span className="font-medium text-gray-900 dark:text-white">{orders.data.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{orders.total}</span> orders</p>
            {loading && <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Updating...</div>}
          </div>
          <Table data={orders.data} columns={columns} keyField="id" onRowClick={(order: OrderEvent) => navigate(`/orders/${order.id}`)} emptyMessage="No orders found. Try adjusting your filters." sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          <Pagination currentPage={orders.page} totalPages={orders.totalPages} onPageChange={setPage} disabled={loading} />
        </>
      )}
    </div>
  );
};
