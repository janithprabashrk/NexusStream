import React, { useState, useEffect } from 'react';
import { Card, Loading } from '@/components';
import { ordersApi } from '@/api';
import { OrderStatistics } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await ordersApi.getStatistics();
        setStats(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loading size="lg" text="Loading statistics..." fullPage />;
  }

  if (error) {
    return (
      <div className="dashboard">
        <Card className="error-card">
          <p className="error-message">{error}</p>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const partnerAOrders = stats.ordersByPartner['PARTNER_A'] || 0;
  const partnerBOrders = stats.ordersByPartner['PARTNER_B'] || 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.totalOrders.toLocaleString()}</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Gross Amount</span>
            <span className="stat-value">{formatCurrency(stats.totalGrossAmount)}</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Tax Amount</span>
            <span className="stat-value">{formatCurrency(stats.totalTaxAmount)}</span>
          </div>
        </Card>

        <Card className="stat-card highlight">
          <div className="stat-content">
            <span className="stat-label">Net Amount</span>
            <span className="stat-value">{formatCurrency(stats.totalNetAmount)}</span>
          </div>
        </Card>
      </div>

      <div className="details-row">
        <Card title="Orders by Partner" className="partner-card">
          <div className="partner-stats">
            <div className="partner-item partner-a">
              <div className="partner-info">
                <span className="partner-name">Partner A</span>
                <span className="partner-count">{partnerAOrders.toLocaleString()} orders</span>
              </div>
              <div className="partner-bar-container">
                <div
                  className="partner-bar"
                  style={{
                    width: stats.totalOrders > 0
                      ? `${(partnerAOrders / stats.totalOrders) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="partner-percentage">
                {stats.totalOrders > 0
                  ? ((partnerAOrders / stats.totalOrders) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>

            <div className="partner-item partner-b">
              <div className="partner-info">
                <span className="partner-name">Partner B</span>
                <span className="partner-count">{partnerBOrders.toLocaleString()} orders</span>
              </div>
              <div className="partner-bar-container">
                <div
                  className="partner-bar"
                  style={{
                    width: stats.totalOrders > 0
                      ? `${(partnerBOrders / stats.totalOrders) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="partner-percentage">
                {stats.totalOrders > 0
                  ? ((partnerBOrders / stats.totalOrders) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </Card>

        <Card title="Average Order Value" className="avg-card">
          <div className="avg-value">
            <span className="avg-amount">{formatCurrency(stats.averageOrderValue)}</span>
            <span className="avg-label">per order</span>
          </div>
        </Card>
      </div>

      {Object.keys(stats.ordersByDate).length > 0 && (
        <Card title="Orders by Date">
          <div className="date-stats">
            {Object.entries(stats.ordersByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([date, count]) => (
                <div key={date} className="date-item">
                  <span className="date-label">{new Date(date).toLocaleDateString()}</span>
                  <span className="date-count">{count} orders</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};
