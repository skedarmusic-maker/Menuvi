'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
import { ShoppingBag, Mail, Lock, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CustomerLoginPage() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const redirectUrl = searchParams.get('redirect') || `/${slug}/account`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${slug}/account`,
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Conta criada! Verifique seu e-mail para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(redirectUrl);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col p-6">
      <div className="flex items-center mb-12">
        <Link href={`/${slug}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
             <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' 
              ? 'Entre para ver seu histórico e endereços salvos.' 
              : 'Cadastre-se para agilizar seus próximos pedidos.'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-sm font-bold text-center animate-in fade-in zoom-in-95 ${
            message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input 
                 type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="seu@email.com"
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
               <input 
                 type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
               />
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors"
          >
            {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre aqui'}
          </button>
        </div>
      </div>
    </main>
  );
}
