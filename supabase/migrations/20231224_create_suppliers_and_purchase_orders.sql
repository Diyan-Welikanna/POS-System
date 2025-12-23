-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, received, cancelled
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    received_by UUID REFERENCES profiles(id),
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Add RLS policies
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Allow authenticated users to read suppliers"
    ON suppliers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin and manager to insert suppliers"
    ON suppliers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin and manager to update suppliers"
    ON suppliers FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin to delete suppliers"
    ON suppliers FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Purchase orders policies
CREATE POLICY "Allow authenticated users to read purchase orders"
    ON purchase_orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin and manager to insert purchase orders"
    ON purchase_orders FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin and manager to update purchase orders"
    ON purchase_orders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin to delete purchase orders"
    ON purchase_orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Purchase order items policies
CREATE POLICY "Allow authenticated users to read purchase order items"
    ON purchase_order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow admin and manager to insert purchase order items"
    ON purchase_order_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin and manager to update purchase order items"
    ON purchase_order_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Allow admin to delete purchase order items"
    ON purchase_order_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to update purchase order total
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(total_cost), 0)
        FROM purchase_order_items
        WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
    )
    WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update purchase order total
CREATE TRIGGER update_purchase_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_total();

-- Function to update stock when purchase order is received
CREATE OR REPLACE FUNCTION update_stock_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update stock when status changes to 'received'
    IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
        -- Update stock for each item in the purchase order
        UPDATE products
        SET stock_quantity = stock_quantity + poi.quantity
        FROM purchase_order_items poi
        WHERE products.id = poi.product_id
        AND poi.purchase_order_id = NEW.id;
        
        -- Record who received it and when
        NEW.received_by = auth.uid();
        NEW.received_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock
CREATE TRIGGER auto_update_stock_trigger
BEFORE UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_receipt();
