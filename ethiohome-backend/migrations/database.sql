-- EthioHome: Digital House Rent and Sale Brokering System
-- PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
    'Admin',
    'Agent',
    'Owner',
    'Renter',
    'Buyer',
    'Land_Manager'
);

CREATE TYPE user_status AS ENUM ('Pending', 'Active', 'Inactive');

CREATE TYPE language_preference AS ENUM ('English', 'Amharic');

CREATE TYPE listing_type AS ENUM ('Rent', 'Sale');

CREATE TYPE property_type AS ENUM ('House', 'Apartment', 'Villa', 'Studio', 'Commercial', 'Office', 'Shop', 'Land','Other');

CREATE TYPE property_status AS ENUM (
    'Available',
    'Rented',
    'Sold',
    'Unavailable'
);

CREATE TYPE verification_status AS ENUM (
    'Pending',
    'Under_Review',
    'Verified',
    'Rejected'
);

CREATE TYPE booking_status AS ENUM ('Pending', 'Owner_Pending', 'Negotiating', 'Approved', 'Cancelled', 'Completed');

CREATE TYPE transaction_status AS ENUM (
    'Pending', 
    'Completed',  
    'Cancelled'
);

CREATE TYPE payment_status AS ENUM (
    'Pending',
    'Processing',
    'Completed',
    'Failed'
);

CREATE TYPE payment_purpose AS ENUM (
    'Booking_Fee',
    'Guarantee_Deposit',
    'Property_Payment',
    'Commission_Payment',
    'Agent_Commission_Payout',
    'Token_Purchase'
);


-- Function to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';


CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE,
    national_id VARCHAR(12) UNIQUE,
    city VARCHAR(50) NOT NULL,
    preferred_language language_preference DEFAULT 'English',
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Owner',
    status user_status NOT NULL DEFAULT 'Pending',
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    last_login TIMESTAMP
    WITH
        TIME ZONE,
        profile_image TEXT, -- URL to profile photo
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create index idx_users_city on users (city);

create index idx_users_role on users (role);

create index idx_users_status on users (status);

create index idx_users_is_verified on users (is_verified);

create index idx_users_last_login on users (last_login);

create index idx_users_profile_image on users (profile_image);

-- System Audit Logs for tracking administrative actions
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE otp_verifications (
    otp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (user_id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        attempts INTEGER DEFAULT 0,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,

    region VARCHAR(100) NOT NULL, -- e.g. Amhara, Oromia, Addis Ababa

    latitude DECIMAL(10, 7),  -- for maps
    longitude DECIMAL(10, 7),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prevent duplicate cities
ALTER TABLE cities
ADD CONSTRAINT unique_city_name UNIQUE (name_en);

-- Optional index for fast search
CREATE INDEX idx_cities_name_en ON cities(name_en);
CREATE INDEX idx_cities_region ON cities(region);

INSERT INTO cities (name_en, name_am, region, latitude, longitude) VALUES
('Addis Ababa', 'አዲስ አበባ', 'Addis Ababa', 9.0300, 38.7400),
('Bahir Dar', 'ባህር ዳር', 'Amhara', 11.6000, 37.3833),
('Gondar', 'ጎንደር', 'Amhara', 12.6000, 37.4667),
('Hawassa', 'ሀዋሳ', 'SNNPR', 7.0500, 38.4761),
('Adama', 'አዳማ', 'Oromia', 8.5400, 39.2700),
('Mekelle', 'መቀሌ', 'Tigray', 13.4967, 39.4753);

-- 2.2 Sub Cities Table: For filtering by districts within cities
CREATE TABLE sub_cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sub_cities ADD CONSTRAINT unique_sub_city_name UNIQUE (city_id, name_en);

CREATE INDEX idx_sub_cities_city_id ON sub_cities(city_id);
CREATE INDEX idx_sub_cities_name_en ON sub_cities(name_en);

CREATE TRIGGER tr_update_sub_cities_timestamp
    BEFORE UPDATE ON sub_cities
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Seed Addis Ababa sub-cities
INSERT INTO sub_cities (city_id, name_en, name_am)
SELECT id, 'Bole', 'ቦሌ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Yeka', 'የካ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Arada', 'አራዳ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Kirkos', 'ቂርቆስ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Lideta', 'ልደታ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Nifas Silk-Lafto', 'ንፋስ ስልክ ላፍቶ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Kolfe Keranio', 'ኮልፌ ቀራኒዮ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Akaki Kality', 'አቃቂ ቃሊቲ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Gullele', 'ጉለሌ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Addis Ketema', 'አዲስ ከተማ' FROM cities WHERE name_en = 'Addis Ababa'
UNION ALL SELECT id, 'Lemi Kura', 'ለሚ ኩራ' FROM cities WHERE name_en = 'Addis Ababa';

-- Seed Bahir Dar sub-cities
INSERT INTO sub_cities (city_id, name_en, name_am)
SELECT id, 'Fasilo', 'ፋሲሎ' FROM cities WHERE name_en = 'Bahir Dar'
UNION ALL SELECT id, 'Ginbot 20', 'ግንቦት 20' FROM cities WHERE name_en = 'Bahir Dar'
UNION ALL SELECT id, 'Shimbit', 'ሽምቢት' FROM cities WHERE name_en = 'Bahir Dar'
UNION ALL SELECT id, 'Tana', 'ጣና' FROM cities WHERE name_en = 'Bahir Dar'
UNION ALL SELECT id, 'Belay Zeleke', 'በላይ ዘለቀ' FROM cities WHERE name_en = 'Bahir Dar'
UNION ALL SELECT id, 'Hadar', 'ሀዳር' FROM cities WHERE name_en = 'Bahir Dar';

-- Seed Gondar sub-cities
INSERT INTO sub_cities (city_id, name_en, name_am)
SELECT id, 'Arada', 'አራዳ' FROM cities WHERE name_en = 'Gondar'
UNION ALL SELECT id, 'Azezo', 'አዘዞ' FROM cities WHERE name_en = 'Gondar'
UNION ALL SELECT id, 'Maraki', 'ማራኪ' FROM cities WHERE name_en = 'Gondar'
UNION ALL SELECT id, 'Tsadiku Yohannes', 'ጻድቁ ዮሐንስ' FROM cities WHERE name_en = 'Gondar'
UNION ALL SELECT id, 'Jantekel', 'ጃንተከል' FROM cities WHERE name_en = 'Gondar';


-- 2.2 Properties Table: Houses, Apartments, Villas, etc. across Ethiopian cities
CREATE TABLE properties (
    property_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    owner_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    title VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    sub_city VARCHAR(50) NOT NULL,
    woreda VARCHAR(50),
    kebele VARCHAR(50),
    house_number VARCHAR(50),
    specific_location TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    property_type property_type NOT NULL, -- e.g., Apartment, Villa, Studio, Commercial
    listing_type listing_type NOT NULL,
    property_image TEXT NOT NULL, -- Primary property photo URL
    number_of_bedrooms INTEGER NOT NULL,
    bedroom_area_size DECIMAL(10, 2), -- Area size per bedroom or total
    number_of_bathrooms INTEGER NOT NULL,
    bathroom_area_size DECIMAL(10, 2),
    number_of_living_rooms INTEGER DEFAULT 1,
    living_room_area_size DECIMAL(10, 2),
    number_of_kitchens INTEGER DEFAULT 1,
    kitchen_area_size DECIMAL(10, 2),
    number_of_floors INTEGER DEFAULT 1,
    area_size DECIMAL(12, 2) NOT NULL, -- Size in square meters
    availability_status property_status NOT NULL DEFAULT 'Unavailable',
    verification_status verification_status DEFAULT 'Pending',
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE property_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    house_plan_url TEXT, -- House plan image URL for verification
    uploaded_by UUID REFERENCES users(user_id),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ==========================================
-- 2.14 Property Images Table
-- ==========================================

CREATE TABLE property_images (
    image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    property_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Cloudinary / S3 / Storage URL
    image_public_id TEXT, -- Optional (for Cloudinary delete support)
    is_primary BOOLEAN DEFAULT FALSE, -- Main display image
    display_order INTEGER DEFAULT 1, -- For image sorting
    uploaded_by UUID REFERENCES users (user_id) ON DELETE SET NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_property_images_property_id ON property_images (property_id);

CREATE INDEX idx_property_images_is_primary ON property_images (is_primary);

CREATE INDEX idx_property_images_display_order ON property_images (display_order);

CREATE TRIGGER tr_update_property_images_timestamp
    BEFORE UPDATE ON property_images
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 2.3 Bookings Table: Manages user inquiries and property visit schedules
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    owner_id UUID NOT NULL 
        REFERENCES users(user_id) ON DELETE CASCADE,

    agent_id UUID 
        REFERENCES users(user_id) ON DELETE SET NULL,

    buyer_renter_id UUID 
        REFERENCES users(user_id) ON DELETE SET NULL,

    listing_type listing_type NOT NULL,

    property_id UUID NOT NULL 
        REFERENCES properties(property_id) ON DELETE CASCADE,

    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,

    message TEXT NOT NULL,

    buyer_tenant_first_name VARCHAR(100),
    buyer_tenant_last_name VARCHAR(100),
    buyer_tenant_phone VARCHAR(20),
    buyer_tenant_email VARCHAR(100),
    buyer_tenant_role VARCHAR(20),

    booking_status booking_status NOT NULL DEFAULT 'Pending',
    negotiated_price NUMERIC(15, 2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 Wishlists Table: Manages user's saved properties
CREATE TABLE wishlists (
    wishlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, property_id)
);

CREATE INDEX idx_wishlists_user_id ON wishlists (user_id);

-- 2.5 Transactions Table: Records rent or sale agreements
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    property_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    buyer_renter_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    transaction_type listing_type NOT NULL,
    agreed_price DECIMAL(12, 2) NOT NULL,
    contract_date DATE NOT NULL,
    transaction_status transaction_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 Commissions Table: Tracks agent/broker earnings per transaction
-- buyer_id is null for Rent deals; renter_id is null for Sale deals; agent_id is null for direct owner deals
CREATE TABLE commissions (
    commission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    transaction_id UUID NOT NULL REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    buyer_renter_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    commission_status payment_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- 2.15 Payment Services Table: Supported banks and payment methods
CREATE TABLE payment_services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    service_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'CBE', 'TELEBIRR', 'CHAPA', 'BOA', 'CASH'
    payment_type VARCHAR(50) NOT NULL CHECK (
        payment_type IN ('Bank', 'Mobile Money', 'Platform Gateway', 'Cash')
    ),
    account_number VARCHAR(100),
    account_holder_name VARCHAR(150),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    instructions_en TEXT,
    instructions_am TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Payment Services
INSERT INTO payment_services (name_en, name_am, service_code, payment_type, account_number, account_holder_name, logo_url, instructions_en, instructions_am) VALUES
('Commercial Bank of Ethiopia', 'የኢትዮጵያ ንግድ ባንክ', 'CBE', 'Bank', '1000583868546', 'Yimenu Shiferaw', 'https://res.cloudinary.com/ethiohome/image/upload/cbe_logo.png', 'Please transfer the payment to account number 1000583868546 and upload a screenshot of the receipt.', 'እባክዎን ክፍያውን ወደ ሂሳብ ቁጥር 1000583868546 ያስተላልፉ እና የደረሰኙን ቅጽበታዊ ገጽ እይታ (ስክሪንሾት) ይጫኑ።'),
('Telebirr', 'ቴሌብር', 'TELEBIRR', 'Mobile Money', '0942114205', 'Abel Shiferaw', 'https://res.cloudinary.com/ethiohome/image/upload/telebirr_logo.png', 'Send via Telebirr Merchant or Send Money to 0942114205 and upload a screenshot of the transaction SMS/receipt.', 'ክፍያውን በቴሌብር መርቻንት ወይም በገንዘብ ማስተላለፊያ ወደ 0942114205 ይላኩ እና የግብይቱን የኤስኤምኤስ/ደረሰኝ ቅጽበታዊ ገጽ እይታ ይጫኑ።'),
('Bank of Abyssinia', 'የአቢሲኒያ ባንክ', 'BOA', 'Bank', '124946328', 'Yimenu Shiferaw', 'https://res.cloudinary.com/ethiohome/image/upload/boa_logo.png', 'Transfer to Bank of Abyssinia account 124946328 and upload a screenshot of your receipt.', 'ወደ አቢሲኒያ ባንክ ሂሳብ ቁጥር 124946328 ያስተላልፉ እና የደረሰኙን ቅጽበታዊ ገጽ እይታ ይጫኑ።'),
('Cash Payment', 'ጥሬ ገንዘብ', 'CASH', 'Cash', NULL, NULL, NULL, 'Pay cash directly at one of our physical branch agents or offices.', 'በአካል ቀርበው በአቅራቢያዎ ለሚገኝ ወኪል ወይም ቢሮ በጥሬ ገንዘብ ይክፈሉ።');

-- 2.5 Payments Table: Tracks financial transactions, receipts, and status based on owners, buyers, and renters
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    transaction_id UUID REFERENCES transactions (transaction_id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties (property_id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings (booking_id) ON DELETE SET NULL,
    commission_id UUID REFERENCES commissions (commission_id) ON DELETE SET NULL,
    
    payer_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    payee_id UUID REFERENCES users (user_id) ON DELETE CASCADE, -- e.g. Property Owner (when buyer/renter pays) or Agent (commission payout), or NULL for platform/admin
    payment_service_id UUID REFERENCES payment_services (service_id) ON DELETE SET NULL,
    
    payment_purpose payment_purpose NOT NULL, -- 'Booking_Fee', 'Guarantee_Deposit', 'Property_Payment', 'Commission_Payment', 'Agent_Commission_Payout', 'Token_Purchase'
    payment_type VARCHAR(50) NOT NULL CHECK (
        payment_type IN ('Bank Transfer', 'Mobile Money', 'Telebirr', 'Cash', 'Platform Gateway')
    ),
    
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    
    receipt_image_url TEXT, -- Screenshot image uploaded by buyer, renter, owner, or agent for validation
    payment_status payment_status NOT NULL DEFAULT 'Pending',
    
    verified_by UUID REFERENCES users (user_id) ON DELETE SET NULL, -- Admin, agent, or owner verifying the payment receipt
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_payer_id ON payments (payer_id);
CREATE INDEX idx_payments_payee_id ON payments (payee_id);
CREATE INDEX idx_payments_payment_service_id ON payments (payment_service_id);
CREATE INDEX idx_payments_payment_purpose ON payments (payment_purpose);
CREATE INDEX idx_payments_payment_status ON payments (payment_status);
CREATE INDEX idx_payments_transaction_id ON payments (transaction_id);
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_property_id ON payments (property_id);
CREATE INDEX idx_payments_commission_id ON payments (commission_id);


-- 2.6 Reviews Table: Customer feedback on properties and agents
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    reviewer_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- Can refer to property_id or agent_id/owner_id
    target_type VARCHAR(20) NOT NULL DEFAULT 'Property', -- 'Property', 'Agent', 'Owner'
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.7 Notifications Table: System alerts for users
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP
    WITH
        TIME ZONE,
        is_sent BOOLEAN DEFAULT FALSE NOT NULL,
        sent_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.8 Audit Logs Table: Administrative monitoring and security tracking
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    admin_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'UPDATE_ROLE', 'DELETE_PROPERTY', 'APPROVE_LISTING'
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. TRIGGERS & FUNCTIONS
-- ==========================================

-- Triggers for users table
CREATE TRIGGER tr_update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Triggers for properties table
CREATE TRIGGER tr_update_properties_timestamp
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 4. SEARCH INDEXES
-- ==========================================

-- Indexes for performance on common search operations
CREATE INDEX idx_property_city ON properties (city);

CREATE INDEX idx_property_price ON properties (price);

CREATE INDEX idx_property_type ON properties (property_type);

CREATE INDEX idx_property_listing_type ON properties (listing_type);

CREATE INDEX idx_user_role ON users (role);

CREATE INDEX idx_booking_visit_date ON bookings (visit_date);

CREATE INDEX idx_property_agent_id ON properties (agent_id);

CREATE INDEX idx_property_owner_id ON properties (owner_id);


-- 2.11 Chat Messages Table: Individual messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    sender_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_chat_sender_id ON chat_messages (sender_id);

CREATE INDEX idx_chat_receiver_id ON chat_messages (receiver_id);

-- 2.12 Disputes Table: Handles user complaints and escalations
CREATE TYPE dispute_status AS ENUM (
    'Pending',
    'Under Investigation',
    'Resolved',
    'Closed'
);

CREATE TYPE dispute_type AS ENUM (
    'Payment',
    'Fraud',
    'Misleading Info',
    'Other'
);

CREATE TABLE disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(property_id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(booking_id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    dispute_type dispute_type NOT NULL DEFAULT 'Other',
    description TEXT NOT NULL,
    evidence_urls TEXT[], -- Array of image/doc URLs
    status dispute_status NOT NULL DEFAULT 'Pending',
    resolution_details TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER tr_update_disputes_timestamp
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_dispute_user_id ON disputes (user_id);

CREATE INDEX idx_dispute_status ON disputes (status);

CREATE INDEX idx_dispute_type ON disputes (dispute_type);

-- 2.13 System Settings Table: Platform-wide configuration
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- e.g., 'Commission', 'Security', 'Platform'
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial settings
INSERT INTO
    system_settings (
        category,
        key,
        value,
        description
    )
VALUES (
        'Commission',
        'rent_sale_split',
        '{"rent": 9, "sale": 2}',
        'Different commission rates for rent vs sale'
    ),
    (
        'Platform',
        'listing_approval_required',
        '{"enabled": true}',
        'If true, new property listings must be approved by admin'
    ),
    (
        'Security',
        'otp_expiry_minutes',
        '{"value": 10}',
        'Time in minutes before an OTP expires'
    ),
    (
        'Security',
        'two_factor_auth_enabled',
        '{"enabled": false}',
        'System-wide toggle for 2FA requirement'
    ),
    (
        'Platform',
        'max_bookings_per_day',
        '{"value": 5}',
        'Maximum number of property visits a user can book per day'
    );

-- DATA TOKEN MARKETPLACE TABLES

-- 1. Datasets Metadata
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en VARCHAR(255) NOT NULL,
    title_am VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_am TEXT,
    category VARCHAR(100) NOT NULL, -- e.g. 'Residential', 'Commercial', 'Land'
    region VARCHAR(100),            -- e.g. 'Addis Ababa', 'All'
    token_cost INTEGER DEFAULT 1,
    record_count INTEGER DEFAULT 0,
    file_path TEXT,                  -- Path on the server or storage bucket
    file_format VARCHAR(10) DEFAULT 'CSV', -- CSV, JSON, XLSX
    file_size_kb INTEGER DEFAULT 0,  -- Size in KB
    sample_data JSONB,               -- Sample data JSON (preview grid of 5-10 rows)
    rating DECIMAL(3,2) DEFAULT 0.00,-- Average rating from users
    download_count INTEGER DEFAULT 0,-- Total downloads
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Token Packages for Purchase
CREATE TABLE data_token_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_am VARCHAR(100) NOT NULL,
    description_en TEXT,
    description_am TEXT,
    token_amount INTEGER NOT NULL,
    bonus_amount INTEGER DEFAULT 0,   -- Extra promotional tokens included in this package
    price DECIMAL(10, 2) NOT NULL,   -- In ETB
    currency VARCHAR(10) DEFAULT 'ETB',
    badge_color VARCHAR(20) DEFAULT '#3B82F6', -- Hex color for premium styling (Starter, Pro, Institutional)
    popular BOOLEAN DEFAULT false,    -- Highlight package in UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Token Balances
CREATE TABLE user_data_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0,        -- Total active tokens
    bonus_balance INTEGER DEFAULT 0,  -- Bonus tokens (gifted/promotional)
    total_spent INTEGER DEFAULT 0,    -- Lifetime tokens spent
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Token Ledger (Audit Logs for Credit/Debit Transactions)
CREATE TABLE token_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN ('Purchase', 'Bonus', 'Spend', 'Refund', 'Expiration')
    ),
    amount INTEGER NOT NULL,          -- Positive for credits, negative for debits
    balance_after INTEGER NOT NULL,    -- Resulting balance
    reference_id UUID,                -- Can link to data_purchases or data_download_logs
    description_en TEXT,
    description_am TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Data Purchase Transactions
CREATE TABLE data_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    package_id UUID REFERENCES data_token_packages(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    payment_method VARCHAR(50), -- 'Chapa', 'TeleBirr', 'CBE'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    transaction_reference VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Data Download Logs
CREATE TABLE data_download_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    tokens_spent INTEGER DEFAULT 1,   -- Tokens debited for this download
    ip_address VARCHAR(45),           -- For security tracking
    user_agent TEXT,                  -- Device info
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX idx_datasets_category ON datasets(category);
CREATE INDEX idx_datasets_region ON datasets(region);
CREATE INDEX idx_data_purchases_user ON data_purchases(user_id);
CREATE INDEX idx_download_logs_user ON data_download_logs(user_id);
CREATE INDEX idx_token_ledger_user ON token_ledger(user_id);

-- Seed Initial Data Token Packages
INSERT INTO data_token_packages (name_en, name_am, description_en, description_am, token_amount, bonus_amount, price, badge_color, popular)
VALUES 
    ('Starter Pack', 'ጀማሪ ፓኬጅ', 'Perfect for individual buyers or researchers investigating a single city.', 'አንድን ከተማ ለሚያጠኑ ግለሰብ ገዢዎች ወይም ተመራማሪዎች ተስማሚ።', 5, 0, 250.00, '#3B82F6', false),
    ('Professional Pack', 'ሙያዊ ፓኬጅ', 'Best for real estate developers and brokers managing active portfolios.', 'ንቁ ፖርትፎሊዮዎችን ለሚያስተዳድሩ የሪል እስቴት አልሚዎች እና ደላሎች ምርጥ።', 15, 2, 600.00, '#8B5CF6', true),
    ('Institutional Pack', 'ተቋማዊ ፓኬጅ', 'Premium corporate package for investment funds, banks, and large brokers.', 'ለኢንቨስትመንት ፈንዶች፣ ባንኮች እና ትልልቅ ደላሎች የተዘጋጀ ፕሪሚየም የድርጅት ፓኬጅ።', 50, 10, 1500.00, '#EF4444', false);

-- Seed an Example Dataset with Premium details and preview records
INSERT INTO datasets (
    title_en, title_am, description_en, description_am, category, region, token_cost, record_count,
    file_path, file_format, file_size_kb, sample_data, rating, download_count, version
)
VALUES 
    (
        'Addis Ababa Residential Market Q1 2026', 
        'የአዲስ አበባ የመኖሪያ ቤት ገበያ Q1 2026', 
        'Complete dataset of residential listings in Addis Ababa for Q1 2026.', 
        'የ2026 የመጀመሪያው ሩብ ዓመት የአዲስ አበባ የመኖሪያ ቤቶች ዝርዝር ዳታ።', 
        'Residential', 
        'Addis Ababa', 
        1, 
        1250,
        'datasets/addis_residential_q1_2026.csv',
        'CSV',
        425,
        '[
            {"title": "Luxury Apartment Bole", "price": 120000, "rooms": 3, "area_sqm": 150, "city": "Addis Ababa", "sub_city": "Bole"},
            {"title": "Cozy Villa Old Airport", "price": 35000000, "rooms": 5, "area_sqm": 450, "city": "Addis Ababa", "sub_city": "Kirkos"},
            {"title": "Modern Studio Kazanchis", "price": 45000, "rooms": 1, "area_sqm": 45, "city": "Addis Ababa", "sub_city": "Kirkos"}
        ]'::jsonb,
        4.85,
        84,
        '1.0.0'
    );
