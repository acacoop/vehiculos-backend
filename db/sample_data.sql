-- Insert sample data into vehicles

INSERT INTO
    vehicles (
        license_plate,
        brand,
        model,
        year
    )
VALUES (
        'AB123CD',
        'Toyota',
        'Corolla',
        2018
    ),
    (
        'ABC123',
        'Ford',
        'Focus',
        2019
    ),
    (
        'AB456EF',
        'Chevrolet',
        'Cruze',
        2020
    ),
    (
        'DEF456',
        'Honda',
        'Civic',
        2021
    ),
    (
        'GHI789',
        'Volkswagen',
        'Golf',
        2022
    );

-- Insert sample data into persons

INSERT INTO
    persons (
        first_name,
        last_name,
        dni,
        email
    )
VALUES (
        'Maximo',
        'Gismondi',
        12345678,
        'mgismondi@acacoop.com.ar'
    ),
    (
        'Elias Federico',
        'Bourda Jorge',
        23456789,
        'ebourdajorge@acacoop.com.ar'
    ),
    (
        'Manuel',
        'Regiardo',
        34567890,
        'mregiardo@acacoop.com.ar'
    ),
    (
        'Gabriel Ayrton',
        'Iglesias D''Orazio',
        45678901,
        'giglesiasdorazio@acacoop.com.ar'
    );

-- Insert sample data into assignments

INSERT INTO
    assignments (person_id, vehicle_id)
VALUES (1, 1), -- Maximo Gismondi assigned to Toyota Corolla
    (2, 2), -- Elias Federico Bourda Jorge assigned to Ford Focus
    (3, 3), -- Manuel Regiardo assigned to Chevrolet Cruze
    (4, 4), -- Gabriel Ayrton Iglesias D'Orazio assigned to Honda Civic
    (1, 5), -- Maximo Gismondi also assigned to Volkswagen Golf
    (2, 5);
-- Elias Federico Bourda Jorge also assigned to Volkswagen Golf