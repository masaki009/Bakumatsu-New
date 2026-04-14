import { useState, useEffect } from 'react';

export interface NotionItem {
  id: string;
  name: string;
  url: string;
  status: string;
  sound: string;
  files: Array<{
    name: string;
    url: string;
  }>;
  notionUrl: string;
  createdTime: string;
  lastEditedTime: string;
}

export interface NotionDataResponse {
  results: NotionItem[];
  has_more: boolean;
  next_cursor: string | null;
}

export function useNotionData() {
  const [data, setData] = useState<NotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration not found');
      }

      const apiUrl = `${supabaseUrl}/functions/v1/notion-database-query?action=query`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result: NotionDataResponse = await response.json();
      setData(result.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
      console.error('Notion data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
