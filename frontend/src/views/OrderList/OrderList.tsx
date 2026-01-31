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
import './OrderList.css';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<PaginatedResult<OrderEvent> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [partnerId, setPartnerId] = useState<PartnerId | ''>(
    (searchParams.get('partnerId') as PartnerId) || ''
  );
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [productId, setProductId] = useState(searchParams.get('productId') || '');

  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sortField') as SortField) || 'processedAt'
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    (searchParams.get('sortDirection') as SortDirection) || 'desc'
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersApi.getOrders({
        page,
        pageSize,
        partnerId: partnerId || undefined,
        customerId: customerId || undefined,
        productId: productId || undefined,
        field: sortField,
        direction: sortDirection,
      });
      setOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, partnerId, customerId, productId, sortField, sortDirection]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleClearFilters = () => {
    setPartnerId('');
    setCustomerId('');
    setProductId('');
    setPage(1);
  };

  const columns: TableColumn<OrderEvent>[] = [
    {
      key: 'sequenceNumber',
      header: 'Seq #',
      sortable: true,
      width: '80px',
    },
    {
      key: 'externalOrderId',
      header: 'Order ID',
      render: (order) => (
        <span className="order-id">{order.externalOrderId}</span>
      ),
    },
    {
      key: 'partnerId',
      header: 'Partner',
      render: (order) => (
        <Badge variant={order.partnerId === 'PARTNER_A' ? 'primary' : 'success'}>
          {order.partnerId === 'PARTNER_A' ? 'Partner A' : 'Partner B'}
        </Badge>
      ),
    },
    {
      key: 'customerId',
      header: 'Customer',
    },
    {
      key: 'productId',
      header: 'Product',
    },
    {
      key: 'quantity',
      header: 'Qty',
      width: '60px',
    },
    {
      key: 'netAmount',
      header: 'Net Amount',
      sortable: true,
      render: (order) => formatCurrency(order.netAmount),
    },
    {
      key: 'transactionTime',
      header: 'Transaction',
      sortable: true,
      render: (order) => formatDate(order.transactionTime),
    },
  ];

  return (
    <div className="order-list">
      <div className="page-header">
        <h1>Orders</h1>
        <Button onClick={() => navigate('/submit')}>Submit Order</Button>
      </div>

      <Card className="filters-card">
        <div className="filters">
          <Select
            label="Partner"
            value={partnerId}
            onChange={(e) => {
              setPartnerId(e.target.value as PartnerId | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Partners' },
              { value: 'PARTNER_A', label: 'Partner A' },
              { value: 'PARTNER_B', label: 'Partner B' },
            ]}
          />
          <Input
            label="Customer ID"
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by customer..."
          />
          <Input
            label="Product ID"
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by product..."
          />
          <div className="filter-actions">
            <Button variant="secondary" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="error-card">
          <p className="error-message">{error}</p>
          <Button onClick={fetchOrders}>Retry</Button>
        </Card>
      )}

      {loading ? (
        <Loading size="lg" text="Loading orders..." />
      ) : orders ? (
        <>
          <Card padding="none">
            <Table
              data={orders.data}
              columns={columns}
              keyField="id"
              onRowClick={(order) => navigate(`/orders/${order.id}`)}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              emptyMessage="No orders found matching your filters"
            />
          </Card>

          <div className="pagination-wrapper">
            <span className="results-info">
              Showing {(orders.page - 1) * orders.pageSize + 1} to{' '}
              {Math.min(orders.page * orders.pageSize, orders.total)} of {orders.total} orders
            </span>
            <Pagination
              currentPage={orders.page}
              totalPages={orders.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
