import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase.js';

export function useSubscription(user) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    const { data: row, error } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at, stripe_customer_id, has_seen_pricing')
      .eq('id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('useSubscription load error:', error);
    }
    setData(row ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    setLoading(true);
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
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      console.error('Checkout error:', json.error);
      alert(`Checkout failed: ${json.error || 'Unknown error'}`);
      return;
    }
    window.location.href = json.url;
  };

  const manageSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/manage-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      console.error('Portal error:', json.error);
      alert(`Could not open billing portal: ${json.error || 'Unknown error'}`);
      return;
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
