-- ==========================================
-- MASALA KITCHEN SUPABASE SCHEMA
-- Paste this script into your Supabase SQL Editor
-- to instantly provision your tables.
-- ==========================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Passwords Table for Authentication
CREATE TABLE IF NOT EXISTS public.passwords (
  user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL
);

-- 3. Create Foods Table
CREATE TABLE IF NOT EXISTS public.foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 4.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  food_items JSONB NOT NULL,
  total_quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  delivery_address TEXT,
  phone TEXT,
  payment_status TEXT DEFAULT 'Pending',
  order_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Realtime Replication (for instant updates)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.foods;

-- Set up security policies (Allow public access for development)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to foods" ON public.foods;
CREATE POLICY "Allow public read access to foods" ON public.foods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public write access to foods" ON public.foods;
CREATE POLICY "Allow public write access to foods" ON public.foods FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to users" ON public.users;
CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to passwords" ON public.passwords;
CREATE POLICY "Allow public access to passwords" ON public.passwords FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to orders" ON public.orders;
CREATE POLICY "Allow public access to orders" ON public.orders FOR ALL USING (true);

-- 6. Seed Default Foods (Only if foods table is empty)
INSERT INTO public.foods (id, name, description, price, category, image, available, rating, created_at)
VALUES 
('food_1', 'Classic Paneer Tikka', 'Cubes of fresh cottage cheese marinated in spiced yogurt and grilled in a traditional tandoor clay oven with bell peppers and onions.', 249, 'Starters', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW()),
('food_2', 'Old Delhi Butter Chicken', 'Tender tandoori chicken cooked in a rich, creamy, and velvety tomato-butter gravy flavored with fenugreek leaves.', 389, 'Mains', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_3', 'Hyderabadi Dum Biryani', 'Fragrant basmati rice layered with aromatic spices and slow-cooked (dum) to lock in pure traditional flavors, served with raita.', 349, 'Mains', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_4', 'Butter Garlic Naan', 'Soft tandoor-baked leavened flatbread brushed with organic butter and finely chopped fresh garlic.', 69, 'Breads', 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=800', true, 4.7, NOW()),
('food_5', 'Creamy Paneer Butter Masala', 'Succulent cottage cheese cubes simmered in a mildly sweet, spicy, onion-tomato cream sauce.', 329, 'Mains', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW()),
('food_6', 'Kesar Gulab Jamun', 'Deep-fried milk solids dumplings soaked in warm saffron-infused sugar syrup, garnishing with pistachio slices.', 99, 'Desserts', 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=800', true, 4.9, NOW()),
('food_7', 'Traditional Mango Lassi', 'Creamy, rich yogurt drink blended sweet with premium Alphonso mango pulp and a pinch of cardamom.', 119, 'Beverages', 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800', true, 4.7, NOW()),
('food_8', 'Saffron Masala Chai', 'Rich Indian milk tea slow-brewed with fresh ginger, crushed cardamoms, cloves, and a hint of fine Kashmiri saffron.', 49, 'Beverages', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800', true, 4.8, NOW())
ON CONFLICT (id) DO NOTHING;
