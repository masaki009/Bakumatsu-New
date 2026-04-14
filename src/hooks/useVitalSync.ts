import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTodayDate } from '../utils/gameLogic';

interface UseVitalSyncOptions {
  userId: string | undefined;
  enabled?: boolean;
}

export function useVitalSync({ userId, enabled = true }: UseVitalSyncOptions) {
  useEffect(() => {
    if (!userId || !enabled) return;

    const updateLastUpdatedDate = async () => {
      try {
        const todayDate = getTodayDate();

        await supabase
          .from('vital')
          .update({ last_updated_date: todayDate })
          .eq('user_id', userId);
      } catch (error) {
        console.error('Failed to update last_updated_date:', error);
      }
    };

    const handleBeforeUnload = () => {
      updateLastUpdatedDate();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateLastUpdatedDate();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, enabled]);
}
