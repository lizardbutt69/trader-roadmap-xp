import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

export function useSubscription(user) {
  const [data, setData] = useState(null);
  // Track which user id `data` belongs to. Loading is derived synchronously
  // from this — prevents a flash of the unsubscribed UI on the render between
  // user becoming set and the fetch effect firing.
  const [dataUserId, setDataUserId] = useState(null);
  const userId = user?.id ?? null;
  const loading = !!userId && dataUserId !== userId;

  const loadSubscription = useCallback(async () => {
    if (!userId) {
      setData(null);
      setDataUserId(null);
      return;
    }
    const { data: row, error } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at, stripe_customer_id, has_seen_pricing')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('useSubscription load error:', error);
    }
    setData(row ?? null);
    setDataUserId(userId);
  }, [userId]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const now = new Date();
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const trialExpired = trialEndsAt ? now > trialEndsAt : true;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const status = data?.subscription_status ?? 'trialing';
  const isTrialing = status === 'trialing' && !trialExpired;
  const isPaid = status === 'active' || status === 'past_due';
  const isActive = isTrialing || isPaid;

  const subscribe = async (plan) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return;
    }
    let res, json;
    try {
      res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      json = await res.json();
    } catch (err) {
      console.error('Checkout network error:', err);
      throw new Error('Network error — could not reach the payment server. Please try again.');
    }
    if (!res.ok || json.error) {
      console.error('Checkout error:', json.error);
      throw new Error(json.error || 'Checkout failed. Please try again.');
    }
    window.location.href = json.url;
  };

  const manageSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    let res, json;
    try {
      res = await fetch('/api/manage-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      json = await res.json();
    } catch (err) {
      console.error('Portal network error:', err);
      throw new Error('Network error — could not reach the billing server. Please try again.');
    }
    if (!res.ok || json.error) {
      console.error('Portal error:', json.error);
      throw new Error(json.error || 'Could not open billing portal. Please try again.');
    }
    window.location.href = json.url;
  };

  return {
    loading,
    isActive,
    isTrialing,
    isPaid,
    trialDaysLeft,
    trialExpired,
    status,
    stripeCustomerId: data?.stripe_customer_id ?? null,
    hasSeenPricing: data?.has_seen_pricing ?? true,
    subscribe,
    manageSubscription,
    refresh: loadSubscription,
  };
}
