import { getSupabaseClient } from '../supabase';

const subscriptions = new Map();

export function createNaeroRealtime() {
  function subscribeToNotifications(userId, onNotification) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel('notifications:' + userId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          onNotification?.(payload.new);
        }
      )
      .subscribe();

    const key = `notifications:${userId}`;
    subscriptions.set(key, channel);
    return () => {
      supabase.removeChannel(channel);
      subscriptions.delete(key);
    };
  }

  function subscribeToSavedPlaces(userId, onChange) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel('saved_places:' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'saved_places', filter: `user_id=eq.${userId}` },
        (payload) => {
          onChange?.(payload);
        }
      )
      .subscribe();

    const key = `saved_places:${userId}`;
    subscriptions.set(key, channel);
    return () => {
      supabase.removeChannel(channel);
      subscriptions.delete(key);
    };
  }

  function subscribeToAI(userId, onMessage) {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channel = supabase
      .channel('ai_messages:' + userId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          onMessage?.(payload.new);
        }
      )
      .subscribe();

    const key = `ai_messages:${userId}`;
    subscriptions.set(key, channel);
    return () => {
      supabase.removeChannel(channel);
      subscriptions.delete(key);
    };
  }

  function unsubscribeAll() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    for (const [key, channel] of subscriptions) {
      supabase.removeChannel(channel);
    }
    subscriptions.clear();
  }

  return {
    subscribeToNotifications,
    subscribeToSavedPlaces,
    subscribeToAI,
    unsubscribeAll,
  };
}

export const naeroRealtime = createNaeroRealtime();
