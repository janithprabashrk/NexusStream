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
    const response = await request<{ status: string; statistics: OrderStatistics }>('/orders/stats');
    return response.statistics;
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

// Errors API (Optional feature - Errors View)
export const errorsApi = {
  async getErrors(params: Record<string, unknown> = {}): Promise<PaginatedResult<any>> {
    const queryString = buildQueryString(params);
    const response = await request<{ status: string } & PaginatedResult<any>>(`/errors${queryString}`);
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      hasNextPage: response.page < response.totalPages,
      hasPreviousPage: response.page > 1,
    };
  },

  async getErrorById(id: string): Promise<any> {
    const response = await request<{ status: string; error: any }>(`/errors/${encodeURIComponent(id)}`);
    return response.error;
  },

  async getStatistics(): Promise<any> {
    const response = await request<{ status: string; statistics: any }>('/errors/stats');
    return response.statistics;
  },
};

export { ApiError };
