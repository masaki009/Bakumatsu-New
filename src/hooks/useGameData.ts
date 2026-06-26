import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Vital, PreVital } from '../types/game';
import { calculateUpdatedStats, getTodayDate } from '../utils/gameLogic';

interface GameData {
  vital: Vital | null;
  preVital: PreVital | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  initializeNewUser: () => Promise<void>;
}

export function useGameData(userId: string | undefined, userEmail: string | undefined): GameData {
  const [vital, setVital] = useState<Vital | null>(null);
  const [preVital, setPreVital] = useState<PreVital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userId || !userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: vitalData, error: vitalError } = await supabase
        .from('vital')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (vitalError) throw vitalError;

      const { data: preVitalData, error: preVitalError } = await supabase
        .from('pre_vital')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (preVitalError) throw preVitalError;

      if (vitalData) {
        const updatedStats = calculateUpdatedStats(vitalData);

        setVital({
          ...vitalData,
          energy: updatedStats.energy,
          toilet: updatedStats.toilet,
          sick: updatedStats.sick
        });
      }

      setPreVital(preVitalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewUser = async () => {
    if (!userId || !userEmail) return;

    try {
      setLoading(true);
      setError(null);

      const { data: existingPreVital } = await supabase
        .from('pre_vital')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let preVitalData = existingPreVital;

      if (!existingPreVital) {
        const { data: newPreVital, error: preVitalError } = await supabase
          .from('pre_vital')
          .insert({
            user_id: userId,
            email: userEmail,
            energy: 0
          })
          .select()
          .single();

        if (preVitalError) throw preVitalError;
        preVitalData = newPreVital;
      }

      const todayDate = getTodayDate();
      const { data: existingVital } = await supabase
        .from('vital')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let vitalData = existingVital;

      if (!existingVital) {
        const { data: newVital, error: vitalError } = await supabase
          .from('vital')
          .insert({
            user_id: userId,
            email: userEmail,
            time: 0,
            energy: 80,
            toilet: 0,
            sick: 0,
            readbooks: 0,
            last_updated_date: todayDate
          })
          .select()
          .single();

        if (vitalError) throw vitalError;
        vitalData = newVital;
      }

      setPreVital(preVitalData);
      setVital(vitalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, userEmail]);

  return {
    vital,
    preVital,
    loading,
    error,
    refreshData: fetchData,
    initializeNewUser
  };
}
