import {
  OrderEvent,
  OrderStatistics,
  PaginatedResult,
  FeedResponse,
  BatchFeedResponse,
  PartnerAInput,
  PartnerBInput,
  QueryParams,
  PartnerId,
} from '@/types';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Date) {
        searchParams.append(key, value.toISOString());
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Orders API
export const ordersApi = {
  async getOrders(params: QueryParams = {}): Promise<PaginatedResult<OrderEvent>> {
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return request<PaginatedResult<OrderEvent>>(`/orders${queryString}`);
  },

  async getOrderById(id: string): Promise<OrderEvent> {
    return request<OrderEvent>(`/orders/${encodeURIComponent(id)}`);
  },

  async getOrderByExternalId(externalId: string): Promise<OrderEvent> {
    return request<OrderEvent>(`/orders/external/${encodeURIComponent(externalId)}`);
  },

  async getOrdersByPartner(
    partnerId: PartnerId,
    params: Omit<QueryParams, 'partnerId'> = {}
  ): Promise<PaginatedResult<OrderEvent>> {
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return request<PaginatedResult<OrderEvent>>(`/orders/by-partner/${partnerId}${queryString}`);
  },

  async getOrdersByCustomer(
    customerId: string,
    params: Omit<QueryParams, 'customerId'> = {}
  ): Promise<PaginatedResult<OrderEvent>> {
    const queryString = buildQueryString(params as unknown as Record<string, unknown>);
    return request<PaginatedResult<OrderEvent>>(`/orders/by-customer/${encodeURIComponent(customerId)}${queryString}`);
  },

  async getStatistics(): Promise<OrderStatistics> {
    return request<OrderStatistics>('/orders/stats');
  },
};

// Feed API
export const feedApi = {
  async submitPartnerA(order: PartnerAInput): Promise<FeedResponse> {
    const url = `${API_BASE}/feed/partner-a`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    
    // Both 202 (accepted) and 422 (rejected) are valid responses
    if (response.status === 202 || response.status === 422) {
      return response.json();
    }
    
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
  },

  async submitPartnerB(order: PartnerBInput): Promise<FeedResponse> {
    const url = `${API_BASE}/feed/partner-b`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    
    // Both 202 (accepted) and 422 (rejected) are valid responses
    if (response.status === 202 || response.status === 422) {
      return response.json();
    }
    
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
  },

  async submitPartnerABatch(orders: PartnerAInput[]): Promise<BatchFeedResponse> {
    return request<BatchFeedResponse>('/feed/partner-a/batch', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  },

  async submitPartnerBBatch(orders: PartnerBInput[]): Promise<BatchFeedResponse> {
    return request<BatchFeedResponse>('/feed/partner-b/batch', {
      method: 'POST',
      body: JSON.stringify({ orders }),
    });
  },
};

export { ApiError };
