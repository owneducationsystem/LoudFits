-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS firebase_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Update orders table with new fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS tax DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS shipping_method TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Convert shipping_address from TEXT to JSONB if not already
ALTER TABLE orders ALTER COLUMN shipping_address TYPE JSONB USING shipping_address::JSONB;

-- Create admin_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Set order_number for existing orders if needed
UPDATE orders SET order_number = CONCAT('LF-', id) WHERE order_number IS NULL;

-- Set other required fields for existing orders
UPDATE orders 
SET 
  subtotal = total * 0.85,
  tax = total * 0.1,  
  shipping_cost = total * 0.05
WHERE subtotal IS NULL AND total IS NOT NULL;