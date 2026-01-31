import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select, Badge } from '@/components';
import { feedApi } from '@/api';
import { PartnerAInput, PartnerBInput, FeedResponse, PartnerId } from '@/types';
import './SubmitOrder.css';

type PartnerType = 'PARTNER_A' | 'PARTNER_B';

interface FormState {
  partner: PartnerType;
  // Partner A fields
  orderId: string;
  skuId: string;
  customerId: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  transactionTimeMs: string;
  // Partner B fields (some overlap)
  transactionId: string;
  itemCode: string;
  clientId: string;
  qty: string;
  price: string;
  tax: string;
  purchaseTime: string;
}

const initialState: FormState = {
  partner: 'PARTNER_A',
  orderId: '',
  skuId: '',
  customerId: '',
  quantity: '',
  unitPrice: '',
  taxRate: '',
  transactionTimeMs: '',
  transactionId: '',
  itemCode: '',
  clientId: '',
  qty: '',
  price: '',
  tax: '',
  purchaseTime: '',
};

export const SubmitOrder: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResponse(null);
    setError(null);
  };

  const generateSampleData = () => {
    const now = new Date();
    if (form.partner === 'PARTNER_A') {
      setForm({
        ...form,
        orderId: `ORD-A-${Date.now()}`,
        skuId: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        customerId: `CUST-${Math.floor(Math.random() * 10000)}`,
        quantity: String(Math.floor(Math.random() * 10) + 1),
        unitPrice: (Math.random() * 100 + 10).toFixed(2),
        taxRate: (Math.random() * 0.2 + 0.05).toFixed(2),
        transactionTimeMs: String(now.getTime()),
      });
    } else {
      setForm({
        ...form,
        transactionId: `TXN-B-${Date.now()}`,
        itemCode: `ITEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        clientId: `CLIENT-${Math.floor(Math.random() * 10000)}`,
        qty: String(Math.floor(Math.random() * 10) + 1),
        price: (Math.random() * 100 + 10).toFixed(2),
        tax: (Math.random() * 20 + 5).toFixed(1),
        purchaseTime: now.toISOString(),
      });
    }
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let result: FeedResponse;

      if (form.partner === 'PARTNER_A') {
        const payload: PartnerAInput = {
          orderId: form.orderId,
          skuId: form.skuId,
          customerId: form.customerId,
          quantity: parseInt(form.quantity, 10),
          unitPrice: parseFloat(form.unitPrice),
          taxRate: parseFloat(form.taxRate),
          transactionTimeMs: parseInt(form.transactionTimeMs, 10),
        };
        result = await feedApi.submitPartnerA(payload);
      } else {
        const payload: PartnerBInput = {
          transactionId: form.transactionId,
          itemCode: form.itemCode,
          clientId: form.clientId,
          qty: parseInt(form.qty, 10),
          price: parseFloat(form.price),
          tax: parseFloat(form.tax),
          purchaseTime: form.purchaseTime,
        };
        result = await feedApi.submitPartnerB(payload);
      }

      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ ...initialState, partner: form.partner });
    setResponse(null);
    setError(null);
  };

  return (
    <div className="submit-order">
      <div className="page-header">
        <h1>Submit Order</h1>
      </div>

      <Card className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="partner-selector">
              <Select
                label="Select Partner"
                value={form.partner}
                onChange={(e) => {
                  updateField('partner', e.target.value);
                  handleReset();
                }}
                options={[
                  { value: 'PARTNER_A', label: 'Partner A' },
                  { value: 'PARTNER_B', label: 'Partner B' },
                ]}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={generateSampleData}
              >
                Generate Sample Data
              </Button>
            </div>
          </div>

          {form.partner === 'PARTNER_A' ? (
            <div className="form-grid">
              <Input
                label="Order ID"
                value={form.orderId}
                onChange={(e) => updateField('orderId', e.target.value)}
                placeholder="e.g., ORD-12345"
                required
              />
              <Input
                label="SKU ID"
                value={form.skuId}
                onChange={(e) => updateField('skuId', e.target.value)}
                placeholder="e.g., SKU-ABC123"
                required
              />
              <Input
                label="Customer ID"
                value={form.customerId}
                onChange={(e) => updateField('customerId', e.target.value)}
                placeholder="e.g., CUST-001"
                required
              />
              <Input
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                placeholder="e.g., 5"
                min="1"
                required
              />
              <Input
                label="Unit Price"
                type="number"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => updateField('unitPrice', e.target.value)}
                placeholder="e.g., 29.99"
                min="0"
                required
              />
              <Input
                label="Tax Rate (0-1)"
                type="number"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => updateField('taxRate', e.target.value)}
                placeholder="e.g., 0.1 for 10%"
                min="0"
                max="1"
                required
                helpText="Decimal format: 0.1 = 10%"
              />
              <Input
                label="Transaction Time (Unix ms)"
                type="number"
                value={form.transactionTimeMs}
                onChange={(e) => updateField('transactionTimeMs', e.target.value)}
                placeholder={String(Date.now())}
                required
              />
            </div>
          ) : (
            <div className="form-grid">
              <Input
                label="Transaction ID"
                value={form.transactionId}
                onChange={(e) => updateField('transactionId', e.target.value)}
                placeholder="e.g., TXN-12345"
                required
              />
              <Input
                label="Item Code"
                value={form.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="e.g., ITEM-XYZ789"
                required
              />
              <Input
                label="Client ID"
                value={form.clientId}
                onChange={(e) => updateField('clientId', e.target.value)}
                placeholder="e.g., CLIENT-001"
                required
              />
              <Input
                label="Quantity"
                type="number"
                value={form.qty}
                onChange={(e) => updateField('qty', e.target.value)}
                placeholder="e.g., 3"
                min="1"
                required
              />
              <Input
                label="Price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="e.g., 49.99"
                min="0"
                required
              />
              <Input
                label="Tax (0-100%)"
                type="number"
                step="0.1"
                value={form.tax}
                onChange={(e) => updateField('tax', e.target.value)}
                placeholder="e.g., 10 for 10%"
                min="0"
                max="100"
                required
                helpText="Percentage format: 10 = 10%"
              />
              <Input
                label="Purchase Time (ISO 8601)"
                type="datetime-local"
                value={form.purchaseTime.slice(0, 16)}
                onChange={(e) =>
                  updateField('purchaseTime', new Date(e.target.value).toISOString())
                }
                required
              />
            </div>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" loading={loading}>
              Submit Order
            </Button>
          </div>
        </form>
      </Card>

      {response && (
        <Card
          className={`response-card ${response.success ? 'success' : 'error'}`}
          title={response.success ? 'Order Submitted Successfully' : 'Submission Failed'}
        >
          {response.success && response.order ? (
            <div className="success-content">
              <div className="success-summary">
                <Badge variant="success">Sequence #{response.order.sequenceNumber}</Badge>
                <span className="order-id">ID: {response.order.id}</span>
              </div>
              <dl className="response-details">
                <div className="detail-row">
                  <dt>External Order ID</dt>
                  <dd>{response.order.externalOrderId}</dd>
                </div>
                <div className="detail-row">
                  <dt>Net Amount</dt>
                  <dd>${response.order.netAmount.toFixed(2)}</dd>
                </div>
              </dl>
              <Button
                variant="primary"
                onClick={() => navigate(`/orders/${response.order!.id}`)}
              >
                View Order Details
              </Button>
            </div>
          ) : (
            <div className="error-content">
              <p>The following validation errors occurred:</p>
              <ul className="error-list">
                {response.errors?.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Card className="response-card error" title="Error">
          <p className="error-message">{error}</p>
        </Card>
      )}
    </div>
  );
};
