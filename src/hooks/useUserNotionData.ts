import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NotionChunkItem {
  id: string;
  name: string;
  url: string;
  status: string;
  sound: string;
  files: Array<{ name: string; url: string }>;
  notionUrl: string;
  createdTime: string;
  lastEditedTime: string;
}

interface UserNotionDataResponse {
  results: NotionChunkItem[];
  has_more: boolean;
  next_cursor: string | null;
  db_id: string;
}

export function useUserNotionData(dbType: 'chunk') {
  const [data, setData] = useState<NotionChunkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notionDbUrl, setNotionDbUrl] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('ログインが必要です');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/notion-database-query?db_type=${dbType}`;

      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTPエラー: ${response.status}`);
      }

      const typed = result as UserNotionDataResponse;
      setData(typed.results);
      if (typed.db_id) {
        setNotionDbUrl(`https://www.notion.so/${typed.db_id.replace(/-/g, '')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      console.error('Notion fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dbType]);

  return { data, loading, error, notionDbUrl, refetch: fetchData };
}
