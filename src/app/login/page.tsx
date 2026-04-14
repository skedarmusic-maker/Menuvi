'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Campos de cadastro
  const [restaurantName, setRestaurantName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [slug, setSlug] = useState('');

  const handleSlugChange = (name: string) => {
    setRestaurantName(name);
    setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('E-mail ou senha incorretos.');
    } else {
      router.push('/admin');
      router.refresh();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!restaurantName || !whatsappNumber || !slug) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    // 1. Cria o usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Cria o restaurante vinculado ao usuário
    if (authData.user) {
      const { error: restaurantError } = await supabase.from('restaurants').insert({
        user_id: authData.user.id,
        name: restaurantName,
        slug: slug,
        whatsapp_number: `55${whatsappNumber.replace(/\D/g, '')}`,
        theme_color: '#ef4444',
        is_open: true,
      });

      if (restaurantError) {
        setError('Erro ao criar restaurante. O slug já pode estar em uso.');
        setLoading(false);
        return;
      }
    }

    router.push('/admin');
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-4">
            <UtensilsCrossed className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Menuvi</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Painel do Restaurante' : 'Criar nova conta'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">

            {/* Campos só no cadastro */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Nome do Restaurante</label>
                  <input
                    type="text"
                    placeholder="Ex: Burguer do Zé"
                    value={restaurantName}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>

                {slug && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
                    <p className="text-gray-500 text-xs">Seu link de cardápio:</p>
                    <p className="text-orange-400 text-sm font-bold mt-0.5">menuvi.app/<span>{slug}</span></p>
                  </div>
                )}

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">WhatsApp (DDD + Número)</label>
                  <input
                    type="tel"
                    placeholder="11 99999-9999"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            <div className="relative">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Senha</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-3.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar no Painel' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              {mode === 'login'
                ? 'Novo restaurante? Criar conta'
                : 'Já tenho conta, entrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-8">
          © 2025 Menuvi · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
