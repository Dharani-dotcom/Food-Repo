-- ==========================================
-- MASALA KITCHEN SUPABASE SCHEMA
-- Paste this script into your Supabase SQL Editor
-- to instantly provision your tables.
-- ==========================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'User',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Foods Table
CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  image TEXT,
  available BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  food_items JSONB NOT NULL,
  total_quantity INTEGER DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  delivery_address TEXT,
  phone TEXT,
  payment_status TEXT DEFAULT 'Pending',
  order_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime Replication (for instant updates)
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table foods;

-- 5. Seed Default Foods (Only if foods table is empty)
INSERT INTO foods (id, name, description, price, category, image, available, rating, created_at)
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
