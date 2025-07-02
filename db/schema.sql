-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid primary key default uuid_generate_v4(),
    license_plate text not null unique,
    brand text not null,
    model text not null,
    year integer not null,
    img_url text not null
);

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id uuid primary key default uuid_generate_v4(),
    first_name text not null,
    last_name text not null,
    dni integer not null unique,
    email text not null unique
);

-- Create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references users (id),
    vehicle_id uuid not null references vehicles (id),
    unique (user_id, vehicle_id)
);

-- Create the reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references users (id),
    vehicle_id uuid not null references vehicles (id),
    start_date date not null,
    end_date date not null
);

-- Create the maintenance categories table
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null
);

-- Create the maintenance table
CREATE TABLE IF NOT EXISTS maintenances (
    id uuid primary key default uuid_generate_v4(),
    category_id uuid not null references maintenance_categories (id),
    name text not null
);

-- Create the assigned maintenance table
CREATE TABLE IF NOT EXISTS assigned_maintenances (
    id uuid primary key default uuid_generate_v4(),
    vehicle_id uuid not null references vehicles (id),
    maintenance_id uuid not null references maintenances (id),
    kilometers_frequency integer,
    days_frequency integer
);

-- Create the maintenance history table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id uuid primary key default uuid_generate_v4(),
    assigned_maintenance_id uuid not null references assigned_maintenances (id),
    user_id uuid not null references users (id),
    date date not null,
    kilometers integer not null,
    notes text
);