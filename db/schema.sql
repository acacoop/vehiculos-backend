-- Drop the database if it exists (requires connecting to a different database)
DROP DATABASE IF EXISTS vehicles_db;

-- Create the database
CREATE DATABASE vehicles_db;

-- Connect to the database
CREATE TABLE vehicles (
    id bigint primary key generated always as identity,
    license_plate text not null unique,
    brand text not null,
    model text not null,
    year integer not null
);

-- Create the users table
CREATE TABLE users (
    id bigint primary key generated always as identity,
    first_name text not null,
    last_name text not null,
    dni integer not null unique,
    email text not null unique
);

-- Create the assignments table
CREATE TABLE assignments (
    id bigint primary key generated always as identity,
    user_id bigint not null references users (id),
    vehicle_id bigint not null references vehicles (id),
    unique (user_id, vehicle_id)
);