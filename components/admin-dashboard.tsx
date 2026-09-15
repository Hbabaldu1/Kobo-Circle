'use client';

import React from 'react';

interface MetricsData {
  totalUsers: number;
  activeUsers: number;
  totalSellers: number;
  listingMetrics: {
    total: number;
    bySale: number;
    byService: number;
    byRequest: number;
    activeSale: number;
    activeService: number;
    activeRequest: number;
    sold: number;
    closed: number;
  };
  inquiries: {
    totalConversations: number;
    totalMessages: number;
  };
  vouches: {
    total: number;
    byCommunity: number;
    byTenure: number;
    byTransaction: number;
  };
  repeatUsers: number;
  completedTransactions: string;
  successfulSellerInteractions: string;
  byState: Array<{
    stateName: string;
    userCount: number;
    listingCount: number;
    activeListingCount: number;
  }>;
}

interface AdminDashboardProps {
  metrics: MetricsData;
}

function MetricCard({
  label,
  value,
  isEstimate = false,
  note,
}: {
  label: string;
  value: string | number;
  isEstimate?: boolean;
  note?: string;
}) {
  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={{
        borderColor: 'var(--adire)',
        backgroundColor: 'var(--paper)',
      }}
    >
      <p
        className="mb-2 text-sm font-semibold"
        style={{ color: 'var(--ink)' }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-bold"
        style={{ color: 'var(--ochre)' }}
      >
        {value}
      </p>
      {isEstimate && (
        <p className="mt-2 text-xs" style={{ color: 'var(--adire)' }}>
          {note || 'Estimated'}
        </p>
      )}
    </div>
  );
}

function StateMetricsTable({ byState }: { byState: MetricsData['byState'] }) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--adire)' }}>
      <table className="w-full" style={{ color: 'var(--ink)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--adire)', color: 'var(--paper)' }}>
            <th className="px-4 py-3 text-left font-semibold">State</th>
            <th className="px-4 py-3 text-right font-semibold">Users</th>
            <th className="px-4 py-3 text-right font-semibold">Total Listings</th>
            <th className="px-4 py-3 text-right font-semibold">Active Listings</th>
          </tr>
        </thead>
        <tbody>
          {byState.map((row, idx) => (
            <tr
              key={row.stateName}
              style={{
                backgroundColor: idx % 2 === 0 ? 'var(--paper)' : 'rgba(214, 167, 69, 0.08)',
              }}
            >
              <td className="border-t px-4 py-3" style={{ borderColor: 'var(--adire)' }}>
                {row.stateName}
              </td>
              <td className="border-t px-4 py-3 text-right" style={{ borderColor: 'var(--adire)' }}>
                {row.userCount}
              </td>
              <td className="border-t px-4 py-3 text-right" style={{ borderColor: 'var(--adire)' }}>
                {row.listingCount}
              </td>
              <td className="border-t px-4 py-3 text-right" style={{ borderColor: 'var(--adire)' }}>
                {row.activeListingCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({ metrics }: AdminDashboardProps) {
  return (
    <main
      className="min-h-screen px-4 py-8 md:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold" style={{ color: 'var(--ink)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink)', opacity: 0.7 }}>
            Real-time metrics and analytics for Kobo Circle
          </p>
        </div>

        {/* User Metrics */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            User Metrics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Registered Users" value={metrics.totalUsers} />
            <MetricCard label="Active Users (30 days)" value={metrics.activeUsers} />
            <MetricCard label="Total Sellers" value={metrics.totalSellers} />
            <MetricCard
              label="Repeat Users"
              value={metrics.repeatUsers}
              note="Users with >1 listing or >1 vouch"
            />
          </div>
        </section>

        {/* Listing Metrics */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Listing Metrics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Total Listings" value={metrics.listingMetrics.total} />
            <MetricCard label="Sale" value={metrics.listingMetrics.bySale} />
            <MetricCard label="Service" value={metrics.listingMetrics.byService} />
            <MetricCard label="Request" value={metrics.listingMetrics.byRequest} />
            <MetricCard label="Active" value={metrics.listingMetrics.activeSale} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <MetricCard label="Sold" value={metrics.listingMetrics.sold} />
            <MetricCard label="Closed" value={metrics.listingMetrics.closed} />
          </div>
        </section>

        {/* Inquiry & Communication Metrics */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Communication Metrics
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Total Conversations" value={metrics.inquiries.totalConversations} />
            <MetricCard label="Total Messages" value={metrics.inquiries.totalMessages} />
          </div>
        </section>

        {/* Vouches & Reputation */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Vouches & Reputation
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Vouches" value={metrics.vouches.total} />
            <MetricCard label="Community Vouches" value={metrics.vouches.byCommunity} />
            <MetricCard label="Tenure Vouches" value={metrics.vouches.byTenure} />
            <MetricCard label="Transaction Vouches" value={metrics.vouches.byTransaction} />
          </div>
        </section>

        {/* Transaction & Interaction Metrics */}
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Transaction Activity
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              label="Completed Transactions"
              value="Estimated"
              isEstimate={true}
              note={metrics.completedTransactions}
            />
            <MetricCard
              label="Successful Seller Interactions"
              value="Estimated"
              isEstimate={true}
              note={metrics.successfulSellerInteractions}
            />
          </div>
          <div className="mt-4">
            <MetricCard
              label="Disputes"
              value="Not yet implemented"
              isEstimate={true}
              note="Dispute tracking feature not yet deployed"
            />
          </div>
        </section>

        {/* State Breakdown */}
        <section>
          <h2 className="mb-4 text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Metrics by State
          </h2>
          <StateMetricsTable byState={metrics.byState} />
        </section>
      </div>
    </main>
  );
}
