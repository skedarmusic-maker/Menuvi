import { createBrowserClient } from '@supabase/ssr';

export const createSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📡 [Supabase Debug] URL:', url ? 'Configurada' : 'ERRO: URL AUSENTE');
  console.log('📡 [Supabase Debug] Key:', key ? 'Configurada' : 'ERRO: KEY AUSENTE');

  if (!url || !key) {
    console.error('❌ [Supabase] Chaves de configuração não encontradas!');
  }
  
  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder'
  );
};
