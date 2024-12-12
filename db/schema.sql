CREATE TABLE vehicles (
    id bigint primary key generated always as identity,
    license_plate text not null unique,
    brand text not null,
    model text not null,
    year integer not null
);

CREATE TABLE persons (
    id bigint primary key generated always as identity,
    first_name text not null,
    last_name text not null,
    dni integer not null unique,
    email text not null unique
);

CREATE TABLE assignments (
    id bigint primary key generated always as identity,
    person_id bigint not null references persons (id),
    vehicle_id bigint not null references vehicles (id),
    unique (person_id, vehicle_id)
);