-- 1. Tabela de Restaurantes (Lojas)
create table public.restaurants (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null, -- Vinculado ao login do lojista
    slug text unique not null, -- Ex: 'hamburgueria-do-ze'
    name text not null,
    whatsapp_number text not null,
    logo_url text,
    banner_url text,
    theme_color text default '#FF4500',
    is_open boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categorias do Cardápio
create table public.categories (
    id uuid default gen_random_uuid() primary key,
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    name text not null,
    order_index integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Produtos
create table public.products (
    id uuid default gen_random_uuid() primary key,
    category_id uuid references public.categories(id) on delete cascade not null,
    name text not null,
    description text,
    price numeric(10,2) not null,
    image_url text,
    is_featured boolean default false,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Pedidos
create table public.orders (
    id uuid default gen_random_uuid() primary key,
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    customer_name text not null,
    customer_phone text not null,
    customer_address text not null,
    total_amount numeric(10,2) not null,
    payment_method text not null, -- 'pix' ou 'dinheiro'
    status text default 'new', -- 'new', 'accepted', 'preparing', 'delivering', 'finished', 'canceled'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Itens do Pedido (Relacao Pedido -> Produtos)
create table public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    quantity integer not null default 1,
    unit_price numeric(10,2) not null,
    observations text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATIVAÇÃO DO RLS (Row Level Security) - Regras de Segurança
alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- POLÍTICAS SIMPLIFICADAS PARA INÍCIO

-- O público (anon) pode LER restaurantes, categorias e produtos
create policy "Public can read restaurants" on public.restaurants for select using (true);
create policy "Public can read categories" on public.categories for select using (true);
create policy "Public can read products" on public.products for select using (true);

-- Lojistas (auth) podem MANIPULAR apenas a própria loja e dependências
create policy "Owner can manage own restaurant" on public.restaurants 
  for all using (auth.uid() = user_id);

create policy "Owner can manage categories" on public.categories 
  for all using (
    exists (select 1 from public.restaurants where restaurants.id = categories.restaurant_id and restaurants.user_id = auth.uid())
  );

create policy "Owner can manage products" on public.products 
  for all using (
    exists (
      select 1 from public.categories 
      join public.restaurants on restaurants.id = categories.restaurant_id 
      where categories.id = products.category_id and restaurants.user_id = auth.uid()
    )
  );

-- O público (anon) pode INSERIR pedidos
create policy "Public can insert orders" on public.orders for insert with check (true);
create policy "Public can insert order items" on public.order_items for insert with check (true);

-- Lojistas (auth) podem VER E EDITAR pedidos apenas do seu próprio restaurante
create policy "Owner can manage orders" on public.orders 
  for all using (
    exists (select 1 from public.restaurants where restaurants.id = orders.restaurant_id and restaurants.user_id = auth.uid())
  );

create policy "Owner can manage order items" on public.order_items 
  for all using (
    exists (
      select 1 from public.orders 
      join public.restaurants on restaurants.id = orders.restaurant_id 
      where orders.id = order_items.order_id and restaurants.user_id = auth.uid()
    )
  );

-- SUPABASE SCHEMA ATUALIZACAO: SUPER ADMIN E ASSINATURAS

-- 1. Tabela Super Admins
create table public.super_admins (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insere o Super Admin Principal
insert into public.super_admins (email) values ('focus.earts@gmail.com');

-- 2. Alterar restaurantes para ter controle de assinatura
alter table public.restaurants 
add column if not exists plan_status text default 'trial',
add column if not exists expires_at timestamp with time zone default (now() + interval '7 days'),
add column if not exists is_active boolean default true;

-- Adiciona politica para permitir Super Admins ler tudo
create policy "SuperAdmin can manage all restaurants" on public.restaurants
  for all using (
    exists (select 1 from public.super_admins where email = auth.jwt() ->> 'email')
  );

create policy "SuperAdmin can manage all categories" on public.categories
  for all using (
    exists (select 1 from public.super_admins where email = auth.jwt() ->> 'email')
  );

create policy "SuperAdmin can manage all products" on public.products
  for all using (
    exists (select 1 from public.super_admins where email = auth.jwt() ->> 'email')
  );

create policy "SuperAdmin can manage all orders" on public.orders
  for all using (
    exists (select 1 from public.super_admins where email = auth.jwt() ->> 'email')
  );

