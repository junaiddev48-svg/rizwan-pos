-- Run this in Supabase SQL Editor once
-- Then create Storage bucket named "products" (Public) for image uploads

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "imageUrl" TEXT DEFAULT '',
  modifiers JSONB DEFAULT '[]'::jsonb,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "tokenNumber" INTEGER NOT NULL,
  "shiftId" UUID NOT NULL,
  "orderType" TEXT NOT NULL,
  "tableNumber" TEXT DEFAULT '',
  "customerPhone" TEXT DEFAULT '',
  "customerAddress" TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL,
  "grandTotal" DECIMAL(10,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  status TEXT DEFAULT 'preparing',
  "cancellationReason" TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "openedAt" TIMESTAMPTZ DEFAULT NOW(),
  "closedAt" TIMESTAMPTZ,
  "openedBy" TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "financialSummary" JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS token_counter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  counter INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'cashier')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- For the live DB (run once in SQL Editor):
-- ALTER TABLE staff ADD CONSTRAINT staff_role_check CHECK (role IN ('owner', 'admin', 'cashier'));

ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS products;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS token_counter;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS staff;

-- Seed owner account (only if staff table is empty)
INSERT INTO staff (name, pin, role)
SELECT 'Owner', '1234', 'owner'
WHERE NOT EXISTS (SELECT 1 FROM staff LIMIT 1);

-- Performance indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_orders_shiftId ON orders ("shiftId");
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_shiftId_status ON orders ("shiftId", status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);


-- Seed products (only inserts if table is empty)
INSERT INTO products (name, price, category, "isAvailable", modifiers)
SELECT * FROM (VALUES
  ('Zinger Cheese Burger', 450, 'burgers', true, '[{"modifierId":"mod_extra_cheese","name":"Extra Cheese Slice","additionalPrice":80},{"modifierId":"mod_double_patty","name":"Double Patty Upgrade","additionalPrice":150}]'::jsonb),
  ('Beef Smash Burger', 650, 'burgers', true, '[{"modifierId":"mod_extra_cheese_b","name":"Extra Cheese Slice","additionalPrice":80}]'::jsonb),
  ('Chicken Fillet Burger', 380, 'burgers', true, '[{"modifierId":"mod_extra_mayo","name":"Extra Mayo","additionalPrice":30}]'::jsonb),
  ('Loaded Fries (Regular)', 350, 'loaded_fries', true, '[{"modifierId":"mod_extra_cheese_fries","name":"Extra Cheese","additionalPrice":60},{"modifierId":"mod_extra_chicken","name":"Extra Chicken Topping","additionalPrice":100}]'::jsonb),
  ('Loaded Fries (Large)', 550, 'loaded_fries', true, '[]'::jsonb),
  ('Mint Margarita', 250, 'drinks', true, '[]'::jsonb),
  ('Cold Drink (500ml)', 100, 'drinks', true, '[]'::jsonb),
  ('Family Deal (4 Burgers + 2 Fries + 4 Drinks)', 1200, 'deals', true, '[]'::jsonb),
  ('Chicken Piece (1 pc)', 220, 'chicken', true, '[{"modifierId":"mod_spicy","name":"Extra Spicy","additionalPrice":0},{"modifierId":"mod_bbq","name":"BBQ Sauce","additionalPrice":30}]'::jsonb),
  ('Chicken Piece (3 pcs)', 620, 'chicken', true, '[]'::jsonb),
  ('French Fries (Regular)', 150, 'sides', true, '[]'::jsonb),
  ('Garlic Bread', 180, 'sides', true, '[{"modifierId":"mod_extra_cheese_gb","name":"Extra Cheese","additionalPrice":50}]'::jsonb)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
