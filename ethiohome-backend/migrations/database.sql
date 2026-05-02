-- EthioHome: Digital House Rent and Sale Brokering System
-- PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM (
    'Admin',
    'Agent',
    'Owner',
    'Renter',
    'Buyer'
);

CREATE TYPE user_status AS ENUM ('Pending', 'Active', 'Inactive');

CREATE TYPE language_preference AS ENUM ('English', 'Amharic');

CREATE TYPE listing_type AS ENUM ('Rent', 'Sale');

CREATE TYPE property_status AS ENUM ('Available', 'Rented', 'Sold', 'Unavailable');

CREATE TYPE booking_status AS ENUM ('Pending', 'Approved', 'Cancelled');

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
    provider VARCHAR(20),
    provider_id VARCHAR(255),
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
    specific_location TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    property_type VARCHAR(50) NOT NULL, -- e.g., Apartment, Villa, Studio, Commercial
    listing_type listing_type NOT NULL,
    property_image TEXT NOT NULL, -- Primary property photo URL
    number_of_bedrooms INTEGER NOT NULL,
    number_of_bathrooms INTEGER NOT NULL,
    number_of_living_rooms INTEGER DEFAULT 1,
    number_of_kitchens INTEGER DEFAULT 1,
    number_of_floors INTEGER DEFAULT 1,
    area_size DECIMAL(12, 2) NOT NULL, -- Size in square meters
    availability_status property_status NOT NULL DEFAULT 'Unavailable',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    owner_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    buyer_renter_id UUID REFERENCES users (user_id) ON DELETE SET NULL,
    listing_type listing_type NOT NULL,
    property_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
    visit_date TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        message TEXT NOT NULL,
        booking_status booking_status NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

-- 2.5 Payments Table: Tracks financial transactions and status
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    transaction_id UUID NOT NULL REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,

    payment_service VARCHAR(20) DEFAULT 'chapa',
    payment_type VARCHAR(20) CHECK (
        payment_type IN ('Bank','Mobile Money','Tele Birr','Cash')
    ),

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',

    transaction_ref VARCHAR(255) UNIQUE,
    chapa_tx_ref VARCHAR(255),

    payment_status VARCHAR(20) DEFAULT 'pending',

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(payment_id),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 Reviews Table: Customer feedback on properties and agents
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    reviewer_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES properties (property_id) ON DELETE CASCADE,
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
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 Commissions Table: Tracks agent/broker earnings per transaction
CREATE TABLE commissions (
    commission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    transaction_id UUID NOT NULL REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings (booking_id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    commission_status payment_status NOT NULL DEFAULT 'Pending',
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

-- 2.10 Conversations Table: Groups messages between users
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    participant_one UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    participant_two UUID NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (
            participant_one,
            participant_two
        )
);

-- 2.11 Chat Messages Table: Individual messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    conversation_id UUID NOT NULL REFERENCES conversations (conversation_id) ON DELETE CASCADE,
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

CREATE INDEX idx_chat_conv_id ON chat_messages (conversation_id);

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