import { createBrowserClient } from '@supabase/ssr';

export const createSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = url.startsWith('http') ? url : 'https://placeholder.supabase.co';
  
  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
};
