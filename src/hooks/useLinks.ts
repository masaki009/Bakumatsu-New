import { useState, useEffect } from 'react';
import { supabase, Link } from '../lib/supabase';

export function useLinks(userId: string | null, isAdmin: boolean) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setLinks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リンクの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [userId]);

  const addLink = async (
    linkData: Omit<Link, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    try {
      const maxOrder = links.length > 0
        ? Math.max(...links.map(l => l.order_index))
        : 0;

      const { data, error: insertError } = await supabase
        .from('links')
        .insert([{
          ...linkData,
          order_index: maxOrder + 1,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setLinks([...links, data]);
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'リンクの追加に失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateLink = async (id: string, updates: Partial<Link>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (data) {
        setLinks(links.map(link => link.id === id ? data : link));
      }

      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'リンクの更新に失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setLinks(links.filter(link => link.id !== id));

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'リンクの削除に失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const reorderLinks = async (reorderedLinks: Link[]) => {
    try {
      const updates = reorderedLinks.map((link, index) => ({
        id: link.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('links')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      setLinks(reorderedLinks);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '並び替えに失敗しました';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    links,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    reorderLinks,
    refetch: fetchLinks,
  };
}
