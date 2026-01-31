import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Loading, Button, Badge } from '@/components';
import { ordersApi } from '@/api';
import { OrderEvent } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

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

  if (loading) return <Loading size="lg" text="Loading order..." fullPage />;

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center max-w-md">
          <div className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Order Not Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'The requested order could not be found.'}</p>
            <Button onClick={() => navigate('/orders')}><BackIcon /> Back to Orders</Button>
          </div>
        </Card>
      </div>
    );
  }

  interface DetailItem {
    label: string;
    value: string | number;
    mono?: boolean;
    highlight?: boolean;
  }

  interface DetailSection {
    title: string;
    icon: React.ReactNode;
    items: DetailItem[];
  }

  const detailSections: DetailSection[] = [
    { title: 'Order Information', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, items: [{ label: 'Internal ID', value: order.id, mono: true }, { label: 'External Order ID', value: order.externalOrderId, mono: true }, { label: 'Sequence Number', value: `#${order.sequenceNumber}` }, { label: 'Partner', value: order.partnerId }] },
    { title: 'Customer & Product', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, items: [{ label: 'Customer ID', value: order.customerId }, { label: 'Product ID', value: order.productId }, { label: 'Quantity', value: order.quantity }, { label: 'Unit Price', value: formatCurrency(order.unitPrice) }] },
    { title: 'Financial Details', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, items: [{ label: 'Gross Amount', value: formatCurrency(order.grossAmount) }, { label: 'Tax Amount', value: formatCurrency(order.taxAmount) }, { label: 'Net Amount', value: formatCurrency(order.netAmount), highlight: true }] },
    { title: 'Timestamps', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, items: [{ label: 'Transaction Time', value: formatDate(order.transactionTime, true) }, { label: 'Processed At', value: formatDate(order.processedAt, true) }] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/orders')}><BackIcon /> Back</Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order Details</h1>
            <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">{order.externalOrderId}</p>
          </div>
        </div>
        <Badge variant={order.partnerId === 'PARTNER_A' ? 'primary' : 'cyber'} size="md" pulse>{order.partnerId === 'PARTNER_A' ? 'Partner A' : 'Partner B'}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {detailSections.map((section) => (
          <Card key={section.title} className="overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-700/50">
              <div className="text-cyber-500 dark:text-neon-cyan">{section.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <dt className="text-sm text-gray-500 dark:text-gray-400">{item.label}</dt>
                    <dd className={`text-sm font-medium text-right ${item.mono ? 'font-mono' : ''} ${item.highlight ? 'text-lg font-bold gradient-text' : 'text-gray-900 dark:text-white'}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Order processed and stored successfully
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => window.print()}>Print</Button>
            <Button onClick={() => navigate('/submit')}>Submit New Order</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
