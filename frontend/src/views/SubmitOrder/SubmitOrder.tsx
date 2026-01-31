import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Select, Badge } from '@/components';
import { feedApi } from '@/api';
import { PartnerAInput, PartnerBInput, FeedResponse, isFeedSuccess, FeedSuccessResponse } from '@/types';

type PartnerType = 'PARTNER_A' | 'PARTNER_B';

interface FormState {
  partner: PartnerType;
  orderId: string; skuId: string; customerId: string; quantity: string; unitPrice: string; taxRate: string; transactionTimeMs: string;
  transactionId: string; itemCode: string; clientId: string; qty: string; price: string; tax: string; purchaseTime: string;
}

const initialState: FormState = {
  partner: 'PARTNER_A', orderId: '', skuId: '', customerId: '', quantity: '', unitPrice: '', taxRate: '', transactionTimeMs: '',
  transactionId: '', itemCode: '', clientId: '', qty: '', price: '', tax: '', purchaseTime: '',
};

export const SubmitOrder: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<FeedSuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormState, value: string) => { setForm((prev) => ({ ...prev, [field]: value })); setResponse(null); setError(null); };

  const generateSampleData = () => {
    const now = new Date();
    if (form.partner === 'PARTNER_A') {
      setForm({ ...form, orderId: `ORD-A-${Date.now()}`, skuId: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, customerId: `CUST-${Math.floor(Math.random() * 10000)}`, quantity: String(Math.floor(Math.random() * 10) + 1), unitPrice: (Math.random() * 100 + 10).toFixed(2), taxRate: (Math.random() * 0.2 + 0.05).toFixed(2), transactionTimeMs: String(now.getTime()) });
    } else {
      setForm({ ...form, transactionId: `TXN-B-${Date.now()}`, itemCode: `ITEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, clientId: `CLIENT-${Math.floor(Math.random() * 10000)}`, qty: String(Math.floor(Math.random() * 10) + 1), price: (Math.random() * 100 + 10).toFixed(2), tax: (Math.random() * 20 + 5).toFixed(1), purchaseTime: now.toISOString() });
    }
    setResponse(null); setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setResponse(null);
    try {
      let result: FeedResponse;
      if (form.partner === 'PARTNER_A') {
        const payload: PartnerAInput = { orderId: form.orderId, skuId: form.skuId, customerId: form.customerId, quantity: parseInt(form.quantity, 10), unitPrice: parseFloat(form.unitPrice), taxRate: parseFloat(form.taxRate), transactionTimeMs: parseInt(form.transactionTimeMs, 10) };
        result = await feedApi.submitPartnerA(payload);
      } else {
        const payload: PartnerBInput = { transactionId: form.transactionId, itemCode: form.itemCode, clientId: form.clientId, qty: parseInt(form.qty, 10), price: parseFloat(form.price), tax: parseFloat(form.tax), purchaseTime: form.purchaseTime };
        result = await feedApi.submitPartnerB(payload);
      }
      if (isFeedSuccess(result)) {
        setResponse(result);
      } else {
        setError(result.errors?.join(', ') || 'Validation failed');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed'); } finally { setLoading(false); }
  };

  const handleReset = () => { setForm({ ...initialState, partner: form.partner }); setResponse(null); setError(null); };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submit Order</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Process a new order from a partner feed</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-700/50">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <Select label="Select Partner" value={form.partner} onChange={(e) => { updateField('partner', e.target.value); handleReset(); }} options={[{ value: 'PARTNER_A', label: 'Partner A (orderId, skuId, taxRate decimal)' }, { value: 'PARTNER_B', label: 'Partner B (transactionId, itemCode, tax percentage)' }]} />
              </div>
              <Button type="button" variant="secondary" onClick={generateSampleData}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Generate Sample</Button>
            </div>
          </div>

          <div className="p-6">
            {form.partner === 'PARTNER_A' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Order ID" value={form.orderId} onChange={(e) => updateField('orderId', e.target.value)} placeholder="e.g., ORD-12345" required />
                <Input label="SKU ID" value={form.skuId} onChange={(e) => updateField('skuId', e.target.value)} placeholder="e.g., SKU-ABC123" required />
                <Input label="Customer ID" value={form.customerId} onChange={(e) => updateField('customerId', e.target.value)} placeholder="e.g., CUST-001" required />
                <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} placeholder="e.g., 5" min="1" required />
                <Input label="Unit Price" type="number" value={form.unitPrice} onChange={(e) => updateField('unitPrice', e.target.value)} placeholder="e.g., 29.99" step="0.01" min="0" required helpText="Price per unit in dollars" />
                <Input label="Tax Rate" type="number" value={form.taxRate} onChange={(e) => updateField('taxRate', e.target.value)} placeholder="e.g., 0.08" step="0.01" min="0" max="1" required helpText="Decimal value (0.08 = 8%)" />
                <Input label="Transaction Time (ms)" type="number" value={form.transactionTimeMs} onChange={(e) => updateField('transactionTimeMs', e.target.value)} placeholder="e.g., 1699876543210" required helpText="Unix timestamp in milliseconds" className="sm:col-span-2" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Transaction ID" value={form.transactionId} onChange={(e) => updateField('transactionId', e.target.value)} placeholder="e.g., TXN-B-12345" required />
                <Input label="Item Code" value={form.itemCode} onChange={(e) => updateField('itemCode', e.target.value)} placeholder="e.g., ITEM-XYZ789" required />
                <Input label="Client ID" value={form.clientId} onChange={(e) => updateField('clientId', e.target.value)} placeholder="e.g., CLIENT-001" required />
                <Input label="Quantity" type="number" value={form.qty} onChange={(e) => updateField('qty', e.target.value)} placeholder="e.g., 3" min="1" required />
                <Input label="Price" type="number" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="e.g., 49.99" step="0.01" min="0" required helpText="Unit price in dollars" />
                <Input label="Tax Percentage" type="number" value={form.tax} onChange={(e) => updateField('tax', e.target.value)} placeholder="e.g., 8.5" step="0.1" min="0" max="100" required helpText="Percentage value (8.5 = 8.5%)" />
                <Input label="Purchase Time (ISO)" type="datetime-local" value={form.purchaseTime ? form.purchaseTime.slice(0, 16) : ''} onChange={(e) => updateField('purchaseTime', new Date(e.target.value).toISOString())} required helpText="ISO 8601 format timestamp" className="sm:col-span-2" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-700/50">
            <Button type="button" variant="ghost" onClick={handleReset}>Reset Form</Button>
            <Button type="submit" loading={loading}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Submit Order</Button>
          </div>
        </form>
      </Card>

      {response && response.order && (
        <Card className="overflow-hidden border-2 border-neon-green/30 dark:border-neon-green/50">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-green/10 dark:bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Submitted Successfully</h3>
                  <Badge variant="success" pulse>Processed</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-dark-700">
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Event ID</p><p className="font-mono text-sm text-gray-900 dark:text-white">{response.order.id}</p></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sequence Number</p><p className="font-mono text-sm text-gray-900 dark:text-white">#{response.order.sequenceNumber}</p></div>
                  <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Processed At</p><p className="text-sm text-gray-900 dark:text-white">{new Date(response.order.processedAt).toLocaleString()}</p></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/orders/${response.order!.id}`)}>View Order Details</Button>
                  <Button variant="ghost" size="sm" onClick={() => { handleReset(); setResponse(null); }}>Submit Another</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="overflow-hidden border-2 border-red-500/30">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center flex-shrink-0"><svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
              <div className="flex-1"><h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Submission Failed</h3><p className="text-gray-600 dark:text-gray-300">{error}</p></div>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-cyber-500/5 dark:bg-neon-cyan/5 border-cyber-500/20 dark:border-neon-cyan/20">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-cyber-500 dark:text-neon-cyan"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Partner Format Reference</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p><strong>Partner A:</strong> Uses decimal tax rate (0.08 = 8%), millisecond timestamps, orderId/skuId naming</p>
                <p><strong>Partner B:</strong> Uses percentage tax (8.5 = 8.5%), ISO timestamps, transactionId/itemCode naming</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
