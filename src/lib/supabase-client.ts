import { createBrowserClient } from '@supabase/ssr';

interface CustomWindow extends Window {
  __NEXT_PUBLIC_SUPABASE_URL?: string;
  __NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

export const createSupabaseBrowserClient = () => {
  // Try to get from window injected by server layout first to bypass build-time env injection issues on Hostinger
  const customWindow = typeof window !== 'undefined' ? (window as CustomWindow) : null;
  const injectedUrl = customWindow?.__NEXT_PUBLIC_SUPABASE_URL;
  const injectedKey = customWindow?.__NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = injectedUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = injectedKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('⚠️ [Supabase] Chaves não encontradas no build ou no window.');
  }
  
  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder'
  );
};
