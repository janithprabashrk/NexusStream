import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Badge, Loading, Pagination, Select, Button } from '@/components';
import { errorsApi } from '@/api';
import { ErrorEvent, ErrorStatistics, PaginatedResult } from '@/types';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

/**
 * Errors View Component
 * 
 * SPEC REFERENCE: Optional - "Errors View" in React frontend
 * Displays rejected orders with validation error details.
 */
export const ErrorsView: React.FC = () => {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [stats, setStats] = useState<ErrorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [partnerFilter, setPartnerFilter] = useState<string>('');
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);

  const pageSize = 10;

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (partnerFilter) {
        params.partnerId = partnerFilter;
      }
      
      const result = await errorsApi.getErrors(params);
      setErrors(result.data);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch errors');
    } finally {
      setLoading(false);
    }
  }, [page, partnerFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await errorsApi.getStatistics();
      setStats(result);
    } catch (err) {
      console.error('Failed to fetch error stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchErrors();
    fetchStats();
  }, [fetchErrors, fetchStats]);

  const handleRefresh = () => {
    fetchErrors();
    fetchStats();
  };

  const getPartnerBadgeVariant = (partnerId: string) => {
    return partnerId === 'PARTNER_A' ? 'info' : 'secondary';
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (row: ErrorEvent) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {formatRelativeTime(new Date(row.timestamp))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(new Date(row.timestamp))}
          </div>
        </div>
      ),
    },
    {
      key: 'partnerId',
      header: 'Partner',
      render: (row: ErrorEvent) => (
        <Badge variant={getPartnerBadgeVariant(row.partnerId)}>
          {row.partnerId.replace('PARTNER_', '')}
        </Badge>
      ),
    },
    {
      key: 'externalOrderId',
      header: 'Order ID',
      render: (row: ErrorEvent) => (
        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
          {row.externalOrderId || 'N/A'}
        </span>
      ),
    },
    {
      key: 'errorCode',
      header: 'Error Code',
      render: (row: ErrorEvent) => (
        <Badge variant="error" size="sm">
          {row.errorCode}
        </Badge>
      ),
    },
    {
      key: 'errors',
      header: 'Errors',
      render: (row: ErrorEvent) => (
        <div className="max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
          {row.errors?.length || row.details?.length || 0} validation error(s)
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: ErrorEvent) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedError(row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  if (loading && errors.length === 0) {
    return <Loading size="lg" text="Loading error events..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Validation Errors</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            View rejected orders and validation failures
          </p>
        </div>
        <Button variant="secondary" onClick={handleRefresh}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Errors</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalErrors}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last 24h</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.last24Hours}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-500/10 flex items-center justify-center">
                <span className="text-sm font-bold text-cyber-500">A</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Partner A</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.errorsByPartner?.PARTNER_A || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center">
                <span className="text-sm font-bold text-neon-purple">B</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Partner B</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stats.errorsByPartner?.PARTNER_B || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-48">
            <Select
              label="Filter by Partner"
              value={partnerFilter}
              onChange={(e) => {
                setPartnerFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Partners' },
                { value: 'PARTNER_A', label: 'Partner A' },
                { value: 'PARTNER_B', label: 'Partner B' },
              ]}
            />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            Showing {errors.length} of {total} errors
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 text-red-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && errors.length === 0 && !error && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Validation Errors
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All orders have been processed successfully. Great job!
          </p>
        </Card>
      )}

      {/* Errors Table */}
      {errors.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <Table columns={columns} data={errors} loading={loading} />
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Error Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(new Date(selectedError.timestamp))}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedError(null)}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="space-y-4">
                {/* Error Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Partner</p>
                    <Badge variant={getPartnerBadgeVariant(selectedError.partnerId)}>
                      {selectedError.partnerId}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Error Code</p>
                    <Badge variant="error">{selectedError.errorCode}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {selectedError.externalOrderId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Event ID</p>
                    <p className="font-mono text-xs text-gray-900 dark:text-white truncate">
                      {selectedError.id}
                    </p>
                  </div>
                </div>

                {/* Validation Errors */}
                {(selectedError.errors || selectedError.details) && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Validation Errors
                    </p>
                    <div className="space-y-2">
                      {(selectedError.errors || selectedError.details || []).map((err: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                        >
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {typeof err === 'string' ? err : `${err.field}: ${err.message}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Original Payload */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Original Payload
                  </p>
                  <pre className="p-4 rounded-lg bg-gray-100 dark:bg-dark-700 overflow-x-auto text-xs font-mono text-gray-800 dark:text-gray-200">
                    {JSON.stringify(selectedError.originalPayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
