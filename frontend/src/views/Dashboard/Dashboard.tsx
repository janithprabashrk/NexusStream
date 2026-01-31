import React, { useState, useEffect } from 'react';
import { Card, Loading } from '@/components';
import { ordersApi } from '@/api';
import { OrderStatistics } from '@/types';
import { formatCurrency } from '@/utils/formatters';

// Stat Card Icons
const TotalOrdersIcon = () => (
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyber-500 to-cyber-600 dark:from-neon-cyan dark:to-cyber-500 flex items-center justify-center shadow-lg shadow-cyber-500/25 dark:shadow-neon-cyan/25">
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  </div>
);

const GrossAmountIcon = () => (
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-lg shadow-neon-purple/25">
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);

const TaxIcon = () => (
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  </div>
);

const NetAmountIcon = () => (
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-green to-emerald-500 flex items-center justify-center shadow-lg shadow-neon-green/25">
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  </div>
);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center max-w-md">
          <div className="p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const partnerAOrders = stats.ordersByPartner?.['PARTNER_A'] || 0;
  const partnerBOrders = stats.ordersByPartner?.['PARTNER_B'] || 0;
  const totalOrders = stats.totalOrders ?? 0;

  const statCards = [
    {
      label: 'Total Orders',
      value: (stats.totalOrders ?? 0).toLocaleString(),
      icon: TotalOrdersIcon,
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: 'Gross Amount',
      value: formatCurrency(stats.totalGrossAmount ?? 0),
      icon: GrossAmountIcon,
      trend: '+8.2%',
      trendUp: true,
    },
    {
      label: 'Tax Amount',
      value: formatCurrency(stats.totalTaxAmount ?? 0),
      icon: TaxIcon,
      trend: '+5.1%',
      trendUp: true,
    },
    {
      label: 'Net Amount',
      value: formatCurrency(stats.totalNetAmount ?? 0),
      icon: NetAmountIcon,
      trend: '+15.3%',
      trendUp: true,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Overview of your order processing metrics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-500/10 dark:bg-neon-cyan/10 border border-cyber-500/20 dark:border-neon-cyan/20">
          <div className="w-2 h-2 rounded-full bg-cyber-500 dark:bg-neon-cyan animate-pulse" />
          <span className="text-sm font-medium text-cyber-600 dark:text-neon-cyan">Real-time sync active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`
              card group relative overflow-hidden
              ${stat.highlight ? 'ring-2 ring-neon-green/30 dark:ring-neon-green/50' : ''}
            `}
          >
            {stat.highlight && (
              <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 to-transparent dark:from-neon-green/10" />
            )}
            
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <stat.icon />
                <span className={`
                  flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                  ${stat.trendUp 
                    ? 'bg-green-500/10 dark:bg-neon-green/10 text-green-600 dark:text-neon-green' 
                    : 'bg-red-500/10 text-red-600'
                  }
                `}>
                  {stat.trendUp ? '↑' : '↓'} {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.highlight ? 'gradient-text' : 'text-gray-900 dark:text-white'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Partner Distribution & Average Value */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Partner Distribution */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Orders by Partner</h3>
          
          <div className="space-y-6">
            {/* Partner A */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyber-500 dark:bg-neon-cyan" />
                  <span className="font-medium text-gray-900 dark:text-white">Partner A</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">{partnerAOrders.toLocaleString()}</span>
                  <span className="text-gray-400 dark:text-gray-500 ml-1">orders</span>
                </div>
              </div>
              <div className="relative h-3 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyber-500 to-cyber-400 dark:from-neon-cyan dark:to-cyber-400 transition-all duration-500"
                  style={{ width: totalOrders > 0 ? `${(partnerAOrders / totalOrders) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalOrders > 0 ? ((partnerAOrders / totalOrders) * 100).toFixed(1) : 0}% of total orders
              </p>
            </div>

            {/* Partner B */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-neon-purple" />
                  <span className="font-medium text-gray-900 dark:text-white">Partner B</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-900 dark:text-white">{partnerBOrders.toLocaleString()}</span>
                  <span className="text-gray-400 dark:text-gray-500 ml-1">orders</span>
                </div>
              </div>
              <div className="relative h-3 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-500"
                  style={{ width: totalOrders > 0 ? `${(partnerBOrders / totalOrders) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalOrders > 0 ? ((partnerBOrders / totalOrders) * 100).toFixed(1) : 0}% of total orders
              </p>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-dark-700" />
              <circle cx="64" cy="64" r="56" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${0.75 * 352} ${352}`} className="transition-all duration-1000" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.averageOrderValue || 0)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">avg / order</span>
            </div>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Average Order Value</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Based on {totalOrders.toLocaleString()} orders</p>
        </div>
      </div>

      {/* Orders by Date */}
      {stats.ordersByDate && Object.keys(stats.ordersByDate).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.ordersByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([date, count]) => (
                <div
                  key={date}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-dark-700 text-center group hover:bg-cyber-500/10 dark:hover:bg-neon-cyan/10 transition-colors"
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-cyber-600 dark:group-hover:text-neon-cyan transition-colors">
                    {count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
