-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid primary key default uuid_generate_v4 (),
    license_plate text not null unique,
    brand text not null,
    model text not null,
    year integer not null,
    img_url text not null
);

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id uuid primary key default uuid_generate_v4 (),
    first_name text not null,
    last_name text not null,
    dni integer not null unique,
    email text not null unique,
    active boolean not null default true
);

-- Create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references users (id),
    vehicle_id uuid not null references vehicles (id),
    start_date date not null default CURRENT_DATE,
    end_date date,
    unique (user_id, vehicle_id)
);

-- Create the reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id uuid primary key default uuid_generate_v4 (),
    user_id uuid not null references users (id),
    vehicle_id uuid not null references vehicles (id),
    start_date date not null,
    end_date date not null
);

-- Create the maintenance categories table
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id uuid primary key default uuid_generate_v4 (),
    name text not null
);

-- Create the maintenance table
CREATE TABLE IF NOT EXISTS maintenances (
    id uuid primary key default uuid_generate_v4 (),
    category_id uuid not null references maintenance_categories (id),
    name text not null
);

-- Create the assigned maintenance table
CREATE TABLE IF NOT EXISTS assigned_maintenances (
    id uuid primary key default uuid_generate_v4 (),
    vehicle_id uuid not null references vehicles (id),
    maintenance_id uuid not null references maintenances (id),
    kilometers_frequency integer,
    days_frequency integer
);

-- Create the maintenance history table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id uuid primary key default uuid_generate_v4 (),
    assigned_maintenance_id uuid not null references assigned_maintenances (id),
    user_id uuid not null references users (id),
    date date not null,
    kilometers integer not null,
    notes text
);

-- Create the vehicle responsibles table
CREATE TABLE IF NOT EXISTS vehicle_responsibles (
    id uuid primary key default uuid_generate_v4 (),
    vehicle_id uuid not null references vehicles (id),
    user_id uuid not null references users (id),
    start_date date not null default CURRENT_DATE,
    end_date date,
    created_at timestamp
    with
        time zone default now(),
        updated_at timestamp
    with
        time zone default now()
);

-- Documents management schema

-- TIPOS DE ENTIDADES
CREATE TABLE IF NOT EXISTS entity_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name text NOT NULL UNIQUE
);

-- TIPOS DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS document_types (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name text NOT NULL UNIQUE,
    entity_type_id uuid NOT NULL REFERENCES entity_types (id) ON DELETE CASCADE
);

-- Definición de archivos requeridos por tipo de documento

CREATE TABLE IF NOT EXISTS document_type_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    document_type_id uuid NOT NULL REFERENCES document_types (id) ON DELETE CASCADE,
    name text NOT NULL,
    CONSTRAINT unique_file_per_document_type UNIQUE (document_type_id, name)
);

-- DOCUMENTOS (variables)
CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    document_type_id uuid NOT NULL REFERENCES document_types (id) ON DELETE CASCADE,
    entity_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ARCHIVOS EN DOCUMENTO (inmutables, versionados)

CREATE TABLE IF NOT EXISTS document_files (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    document_id uuid NOT NULL REFERENCES documents (id) ON DELETE CASCADE,
    document_type_file_id uuid NOT NULL REFERENCES document_type_files (id) ON DELETE CASCADE,
    stored_filename text NOT NULL UNIQUE,
    file_path text NOT NULL,
    mime_type text NOT NULL,
    file_size bigint NOT NULL, -- Tamaño del archivo en bytes
    version integer NOT NULL DEFAULT 1,
    is_current boolean NOT NULL DEFAULT true,
    upload_date timestamptz NOT NULL DEFAULT NOW(),
    checksum text NOT NULL, -- Checksum del archivo para verificar integridad
    CONSTRAINT unique_current_file UNIQUE (
        document_id,
        document_type_file_id
    )
    WHERE (is_current) DEFERRABLE INITIALLY DEFERRED
);