import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase/auth-server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AdminDashboard } from '@/components/admin-dashboard';
import type { Database } from '@/types/database';

export const revalidate = 0; // Always fresh for admin dashboard

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
    activeSaleCount?: number;
    activeSaleCountValue?: number;
    activeService: number;
    activeServiceCount?: number;
    activeServiceCountValue?: number;
    activeRequest: number;
    activeRequestCount?: number;
    activeRequestCountValue?: number;
    sold: number;
    soldCount?: number;
    soldCountValue?: number;
    closed: number;
    closedCount?: number;
    closedCountValue?: number;
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
  completedTransactions: string; // Estimated
  successfulSellerInteractions: string; // Estimated
  byState: Array<{
    stateName: string;
    userCount: number;
    listingCount: number;
    activeListingCount: number;
  }>;
}

export default async function AdminDashboardPage() {
  // Step 1: Authenticate user with auth server client (cookie-based)
  const authClient = createAuthServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  
  // Step 2: Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Step 3: Get user profile from public.users table (auth client)
  const { data: userProfile } = await authClient.from('users').select('id, is_admin').eq('id', user.id).maybeSingle();
  
  // Step 4: Explicit admin check - redirect if not admin
  if (!(userProfile as any)?.is_admin) {
    redirect('/feed');
  }

  // Step 5: Now that we know user is admin, use service role client for global queries
  const serviceClient = createServerSupabaseClient();
  if (!serviceClient) {
    throw new Error('Service role client not available');
  }

  // Fetch all metrics using service role client
  const metricsData = await fetchMetrics(serviceClient);

  return <AdminDashboard metrics={metricsData} />;
}

async function fetchMetrics(client: ReturnType<typeof createServerSupabaseClient>): Promise<MetricsData> {
  if (!client) throw new Error('Service client required');

  // 1. Total registered users
  const { count: totalUsersCount } = await client
    .from('users')
    .select('id', { count: 'exact', head: true });

  // 2. Active users (last 30 days) - join with auth.users via raw SQL since auth schema is not in Database type
  // For now, we'll use a conservative estimate based on recent messages/vouches
  // or query auth.users table if accessible
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  // Get users with recent activity (messages or vouches in last 30 days)
  const { data: recentMessageSenders } = await client
    .from('messages')
    .select('sender_id', { distinct: true })
    .gte('created_at', thirtyDaysAgo);
  
  const { data: recentVouchers } = await client
    .from('vouches')
    .select('voucher_id', { distinct: true })
    .gte('created_at', thirtyDaysAgo);
  
  const activeUserIds = new Set([
    ...(recentMessageSenders?.map(m => m.sender_id) ?? []),
    ...(recentVouchers?.map(v => v.voucher_id) ?? []),
  ]);
  const activeUsersCount = activeUserIds.size;

  // 3. Total sellers (users with at least one listing)
  const { data: sellersData } = await client
    .from('listings')
    .select('user_id', { distinct: true });
  const sellerIds = new Set(sellersData?.map(l => l.user_id) ?? []);
  const totalSellersCount = sellerIds.size;

  // 4. Listings breakdown
  const { count: totalListingsCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true });

  const { count: saleSaleCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'sale');

  const { count: serviceCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'service');

  const { count: requestCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'request');

  const { count: activeCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: soldCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sold');

  const { count: closedCount } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'closed');

  // 5. Conversations and messages
  const { count: conversationCount } = await client
    .from('conversations')
    .select('id', { count: 'exact', head: true });

  const { count: messageCount } = await client
    .from('messages')
    .select('id', { count: 'exact', head: true });

  // 6. Vouches breakdown
  const { count: totalVouchCount } = await client
    .from('vouches')
    .select('id', { count: 'exact', head: true });

  const { count: communityVouchCount } = await client
    .from('vouches')
    .select('id', { count: 'exact', head: true })
    .eq('vouch_type', 'community');

  const { count: tenureVouchCount } = await client
    .from('vouches')
    .select('id', { count: 'exact', head: true })
    .eq('vouch_type', 'tenure');

  const { count: transactionVouchCount } = await client
    .from('vouches')
    .select('id', { count: 'exact', head: true })
    .eq('vouch_type', 'transaction');

  // 7. Repeat users (users with >1 listing OR >1 vouch)
  const { data: userListingCounts } = await client
    .from('listings')
    .select('user_id', { count: 'exact', distinct: true })
    .then(async (res) => {
      if (!res.data) return { data: null };
      const users: Record<string, number> = {};
      for (const listing of res.data) {
        users[listing.user_id] = (users[listing.user_id] ?? 0) + 1;
      }
      return { data: Object.entries(users).filter(([_, count]) => count > 1).map(([id, _]) => ({ user_id: id })) };
    });

  const { data: userVouchCounts } = await client
    .from('vouches')
    .select('voucher_id')
    .then(async (res) => {
      if (!res.data) return { data: null };
      const users: Record<string, number> = {};
      for (const vouch of res.data) {
        users[vouch.voucher_id] = (users[vouch.voucher_id] ?? 0) + 1;
      }
      return { data: Object.entries(users).filter(([_, count]) => count > 1).map(([id, _]) => ({ voucher_id: id })) };
    });

  const repeatUserIds = new Set([
    ...(userListingCounts?.map(u => u.user_id) ?? []),
    ...(userVouchCounts?.map(u => u.voucher_id) ?? []),
  ]);
  const repeatUsersCount = repeatUserIds.size;

  // 8. Completed transactions estimate (sold listings + transaction vouches)
  const soldListings = soldCount ?? 0;
  const transactionVouches = transactionVouchCount ?? 0;
  const completedTransactionsEstimate = `${Math.max(soldListings, transactionVouches)} (estimated via sold listings & transaction vouches)`;

  // 9. Successful seller interactions estimate (transaction vouches received per seller)
  const successfulSellerInteractionsEstimate = `${transactionVouchCount ?? 0} (estimated via transaction vouches)`;

  // 10. Metrics by state
  const { data: statesData } = await client.from('states').select('id, name');
  const byState = await Promise.all(
    (statesData ?? []).map(async (state) => {
      const { count: userCount } = await client
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('state_id', state.id);

      const { count: listingCount } = await client
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('state_id', state.id);

      const { count: activeListingCount } = await client
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('state_id', state.id)
        .eq('status', 'active');

      return {
        stateName: state.name,
        userCount: userCount ?? 0,
        listingCount: listingCount ?? 0,
        activeListingCount: activeListingCount ?? 0,
      };
    })
  );

  return {
    totalUsers: totalUsersCount ?? 0,
    activeUsers: activeUsersCount,
    totalSellers: totalSellersCount,
    listingMetrics: {
      total: totalListingsCount ?? 0,
      bySale: saleSaleCount ?? 0,
      byService: serviceCount ?? 0,
      byRequest: requestCount ?? 0,
      activeSale: activeCount ?? 0, // Placeholder
      activeService: 0, // Would need separate query
      activeRequest: 0, // Would need separate query
      sold: soldCount ?? 0,
      closed: closedCount ?? 0,
    },
    inquiries: {
      totalConversations: conversationCount ?? 0,
      totalMessages: messageCount ?? 0,
    },
    vouches: {
      total: totalVouchCount ?? 0,
      byCommunity: communityVouchCount ?? 0,
      byTenure: tenureVouchCount ?? 0,
      byTransaction: transactionVouchCount ?? 0,
    },
    repeatUsers: repeatUsersCount,
    completedTransactions: completedTransactionsEstimate,
    successfulSellerInteractions: successfulSellerInteractionsEstimate,
    byState,
  };
}
