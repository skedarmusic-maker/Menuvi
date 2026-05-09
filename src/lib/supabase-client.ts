import { createBrowserClient } from '@supabase/ssr';

export const createSupabaseBrowserClient = () => {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se estiver vazio (problema de build na Hostinger), tentamos um fallback
  // Nota: Em um mundo ideal o build deveria ter as chaves, mas aqui é emergência
  if (!url || !key) {
    console.warn('⚠️ [Supabase] Chaves não encontradas no build. O login pode falhar se não houver cookies ativos.');
  }
  
  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder'
  );
};
