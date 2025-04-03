-- Connect to the database
CREATE TABLE IF NOT EXISTS vehicles (
    id bigint primary key generated always as identity,
    license_plate text not null unique,
    brand text not null,
    model text not null,
    year integer not null,
    img_url text not null
);



-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id bigint primary key generated always as identity,
    first_name text not null,
    last_name text not null,
    dni integer not null unique,
    email text not null unique
);



-- Create the assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id bigint primary key generated always as identity,
    user_id bigint not null references users (id),
    vehicle_id bigint not null references vehicles (id),
    unique (user_id, vehicle_id)
);



-- Create the reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id bigint primary key generated always as identity,
    user_id bigint not null references users (id),
    vehicle_id bigint not null references vehicles (id),
    start_date date not null,
    end_date date not null,
    recurrence_pattern text
);



-- Create the maintenance categories table
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id bigint primary key generated always as identity,
    name text not null
);



-- Create the maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
    id bigint primary key generated always as identity,
    category_id bigint not null references maintenance_categories (id),
    name text not null,
    img_name text not null
)



-- Create the assigned maintenance table
CREATE TABLE IF NOT EXISTS assigned_maintenance (
    id bigint primary key generated always as identity,
    vehicle_id bigint not null references vehicles (id),
    maintenance_id bigint not null references maintenance (id),
    kilometers_frequency integer not null,
    recurrence_pattern text
)



-- Create the maintenance history table
CREATE TABLE IF NOT EXISTS maintenance_history (
    id bigint primary key generated always as identity,
    assigned_maintenance_id bigint not null references assigned_maintenance (id),
    user_id bigint not null references users (id),
    date date not null,
    kilometers integer not null,
    observations text
)
