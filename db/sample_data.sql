-- Insert sample data into vehicles

INSERT INTO
    vehicles (
        license_plate,
        brand,
        model,
        year,
        img_url
    )
VALUES (
        'AB123CD',
        'Toyota',
        'Corolla',
        2018,
        'toyota_corolla.jpg'
    ),
    (
        'ABC123',
        'Ford',
        'Focus',
        2019,
        'ford_focus.jpg'
    ),
    (
        'AB456EF',
        'Chevrolet',
        'Cruze',
        2020,
        'chevrolet_cruze.jpg'
    ),
    (
        'DEF456',
        'Honda',
        'Civic',
        2021,
        'honda_civic.jpg'
    ),
    (
        'GHI789',
        'Volkswagen',
        'Golf',
        2022,
        'volkswagen_golf.jpg'
    );

-- Insert sample data into users

INSERT INTO
    users (
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
    assignments (user_id, vehicle_id)
VALUES (1, 1),
    (2, 2),
    (3, 3),
    (4, 4),
    (1, 5),
    (2, 5);