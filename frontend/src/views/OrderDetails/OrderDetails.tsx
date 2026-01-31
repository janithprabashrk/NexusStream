import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Loading, Button, Badge } from '@/components';
import { ordersApi } from '@/api';
import { OrderEvent } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import './OrderDetails.css';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const result = await ordersApi.getOrderById(id);
        setOrder(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return <Loading size="lg" text="Loading order..." fullPage />;
  }

  if (error || !order) {
    return (
      <div className="order-details">
        <Card className="error-card">
          <h2>Order Not Found</h2>
          <p>{error || 'The requested order could not be found.'}</p>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="order-details">
      <div className="page-header">
        <div className="header-left">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            ← Back
          </Button>
          <h1>Order Details</h1>
        </div>
        <Badge 
          variant={order.partnerId === 'PARTNER_A' ? 'primary' : 'success'}
          size="md"
        >
          {order.partnerId === 'PARTNER_A' ? 'Partner A' : 'Partner B'}
        </Badge>
      </div>

      <div className="details-grid">
        <Card title="Order Information">
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Internal ID</dt>
              <dd className="mono">{order.id}</dd>
            </div>
            <div className="detail-item">
              <dt>External Order ID</dt>
              <dd className="mono">{order.externalOrderId}</dd>
            </div>
            <div className="detail-item">
              <dt>Sequence Number</dt>
              <dd>{order.sequenceNumber}</dd>
            </div>
            <div className="detail-item">
              <dt>Partner</dt>
              <dd>{order.partnerId}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Customer & Product">
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Customer ID</dt>
              <dd>{order.customerId}</dd>
            </div>
            <div className="detail-item">
              <dt>Product ID</dt>
              <dd>{order.productId}</dd>
            </div>
            <div className="detail-item">
              <dt>Quantity</dt>
              <dd>{order.quantity}</dd>
            </div>
            <div className="detail-item">
              <dt>Unit Price</dt>
              <dd>{formatCurrency(order.unitPrice)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Financial Details">
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Gross Amount</dt>
              <dd>{formatCurrency(order.grossAmount)}</dd>
            </div>
            <div className="detail-item">
              <dt>Tax Amount</dt>
              <dd>{formatCurrency(order.taxAmount)}</dd>
            </div>
            <div className="detail-item highlight">
              <dt>Net Amount</dt>
              <dd className="net-amount">{formatCurrency(order.netAmount)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Timestamps">
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Transaction Time</dt>
              <dd>{formatDate(order.transactionTime, true)}</dd>
            </div>
            <div className="detail-item">
              <dt>Processed At</dt>
              <dd>{formatDate(order.processedAt, true)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
};
