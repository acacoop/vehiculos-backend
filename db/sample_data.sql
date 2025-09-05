-- =====================================================
-- SAMPLE DATA FOR VEHICLE MANAGEMENT SYSTEM
-- =====================================================
-- This file contains comprehensive sample data for testing
-- Run with: make sample-data

-- Clear existing data (only sample data, not structure)
DELETE FROM maintenance_records;

DELETE FROM vehicle_kilometers;

DELETE FROM assigned_maintenances;

DELETE FROM maintenances;

DELETE FROM maintenance_categories;

DELETE FROM reservations;

DELETE FROM assignments;

DELETE FROM vehicle_responsibles;

DELETE FROM vehicles;

DELETE FROM users;

-- =====================================================
-- INSERT SAMPLE USERS
-- =====================================================

INSERT INTO
    users (
        first_name,
        last_name,
        cuit,
        email,
        active
    )
VALUES
    -- Management & Admin (all active)
    (
        'Carlos',
        'Rodríguez',
        12345678,
        'carlos.rodriguez@acacoop.com',
        true
    ),
    (
        'María',
        'González',
        23456789,
        'maria.gonzalez@acacoop.com',
        true
    ),
    (
        'Ana',
        'Martínez',
        34567890,
        'ana.martinez@acacoop.com',
        true
    ),
    -- Operations Team (mostly active, one inactive for testing)
    (
        'Juan',
        'Pérez',
        45678901,
        'juan.perez@acacoop.com',
        true
    ),
    (
        'Luis',
        'López',
        56789012,
        'luis.lopez@acacoop.com',
        false
    ),
    (
        'Sofia',
        'Hernández',
        67890123,
        'sofia.hernandez@acacoop.com',
        true
    ),
    (
        'Diego',
        'García',
        78901234,
        'diego.garcia@acacoop.com',
        true
    ),
    (
        'Valentina',
        'Silva',
        89012345,
        'valentina.silva@acacoop.com',
        true
    ),
    -- Field Staff (mix of active and inactive)
    (
        'Andrés',
        'Morales',
        90123456,
        'andres.morales@acacoop.com',
        true
    ),
    (
        'Camila',
        'Torres',
        12987654,
        'camila.torres@acacoop.com',
        false
    ),
    (
        'Miguel',
        'Vargas',
        23876543,
        'miguel.vargas@acacoop.com',
        true
    ),
    (
        'Isabella',
        'Ruiz',
        34765432,
        'isabella.ruiz@acacoop.com',
        true
    ),
    -- Maintenance Team (all active)
    (
        'Roberto',
        'Jiménez',
        45654321,
        'roberto.jimenez@acacoop.com',
        true
    ),
    (
        'Lucía',
        'Castro',
        56543210,
        'lucia.castro@acacoop.com',
        true
    ),
    (
        'Fernando',
        'Romero',
        67432109,
        'fernando.romero@acacoop.com',
        true
    );

-- =====================================================
-- INSERT SAMPLE VEHICLES
-- =====================================================

INSERT INTO
    vehicles (
        license_plate,
        brand,
        model,
        year,
        img_url
    )
VALUES
    -- Sedans for city operations
    (
        'ABC123',
        'Toyota',
        'Corolla',
        2023,
        'https://www.toyota.com/imgix/content/dam/toyota/vehicles/2023/corolla/mlp/desktop/2023-corolla-se-white-d.png'
    ),
    (
        'DEF456',
        'Honda',
        'Civic',
        2022,
        'https://automobiles.honda.com/images/2022/civic-sedan/mlp/hero/civic-sedan-hero-desktop@2x.jpg'
    ),
    (
        'GHI789',
        'Nissan',
        'Sentra',
        2023,
        'https://www.nissanusa.com/content/dam/Nissan/us/vehicle/sentra/2023/bev/key-features/2023-nissan-sentra-bev-key-features-exterior-boulder-gray.jpg'
    ),
    (
        'JKL012',
        'Hyundai',
        'Elantra',
        2022,
        'https://www.hyundaiusa.com/us/en/vehicles/elantra/gallery'
    ),
    -- SUVs for mixed terrain
    (
        'MNO345',
        'Toyota',
        'RAV4',
        2023,
        'https://www.toyota.com/imgix/content/dam/toyota/vehicles/2023/rav4/mlp/desktop/2023-rav4-xle-magnetic-gray-d.png'
    ),
    (
        'PQR678',
        'Honda',
        'CR-V',
        2022,
        'https://automobiles.honda.com/images/2022/cr-v/mlp/hero/2022-cr-v-sport-touring-awd-hero-desktop@2x.jpg'
    ),
    (
        'STU901',
        'Mazda',
        'CX-5',
        2023,
        'https://www.mazdausa.com/siteassets/vehicles/2023/cx-5/vlp/hero/2023-mx-5-rf-hero-desktop.jpg'
    ),
    (
        'VWX234',
        'Subaru',
        'Outback',
        2022,
        'https://www.subaru.com/content/dam/subaru/vehicles/2022/out/2022-outback-hero-desktop.jpg'
    ),
    -- Pickup trucks for heavy duty
    (
        'YZA567',
        'Ford',
        'Ranger',
        2023,
        'https://www.ford.com/content/dam/vdm_ford/live/en_us/ford/nameplate/ranger/2023/collections/equipment/23_FRD_RGR_61112_1.jpg'
    ),
    (
        'BCD890',
        'Chevrolet',
        'Colorado',
        2022,
        'https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/vehicles/2022/trucks/colorado/mov/01-images/2022-colorado-mov-intro-l.jpg'
    ),
    -- Vans for cargo transport  
    (
        'EFG123',
        'Ford',
        'Transit',
        2023,
        'https://www.ford.com/content/dam/vdm_ford/live/en_us/ford/nameplate/transit-cargo-van/2023/collections/equipment/23_FRD_TRN_Cargo_Van_50804_1.jpg'
    ),
    (
        'HIJ456',
        'Mercedes-Benz',
        'Sprinter',
        2022,
        'https://www.mbvans.com/content/dam/mb-vans/us/myco/my22/sprinter-cargo-van/class-page/2022-SPRINTER-CV-HERO-CH1-D.jpg'
    ),
    -- Compact cars for efficiency
    (
        'KLM789',
        'Toyota',
        'Yaris',
        2023,
        'https://www.toyota.com/imgix/content/dam/toyota/vehicles/2023/yaris/mlp/desktop/2023-yaris-ia-sonic-silver-d.png'
    ),
    (
        'NOP012',
        'Nissan',
        'Versa',
        2022,
        'https://www.nissanusa.com/content/dam/Nissan/us/vehicle/versa/2022/bev/overview/2022-nissan-versa-bev-overview-gun-metallic.jpg'
    ),
    -- Electric vehicles
    (
        'QRS345',
        'Tesla',
        'Model 3',
        2023,
        'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Homepage-Desktop-LHD.jpg'
    ),
    (
        'TUV678',
        'Nissan',
        'Leaf',
        2022,
        'https://www.nissanusa.com/content/dam/Nissan/us/vehicle/leaf/2022/bev/overview/2022-nissan-leaf-bev-overview-gun-metallic.jpg'
    );

-- =====================================================
-- INSERT MAINTENANCE CATEGORIES
-- =====================================================
INSERT INTO
    maintenance_categories (name)
VALUES ('Preventive Maintenance'),
    ('Corrective Maintenance'),
    ('Emergency Repairs'),
    ('Scheduled Service'),
    ('Safety Inspections'),
    ('Performance Upgrades'),
    ('Cosmetic Repairs');

-- =====================================================
-- INSERT MAINTENANCE TYPES
-- =====================================================

INSERT INTO maintenances (
    category_id,
    name,
    kilometers_frequency,
    days_frequency,
    observations,
    instructions
)
VALUES
-- Preventive Maintenance
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Oil Change',
    5000,
    90,
    'Cambio de aceite estándar cada 5000 km o 3 meses',
    'Utilizar aceite sintético 5W-30'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Tire Rotation',
    10000,
    180,
    'Rotar neumáticos para desgaste uniforme',
    'Rotar cruzando neumáticos delanteros y traseros'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Air Filter Replacement',
    15000,
    365,
    'Reemplazo de filtro de aire cada 15,000 km o 1 año',
    'Utilizar filtro OEM recomendado'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Brake Inspection',
    10000,
    180,
    'Revisar estado de pastillas y discos',
    'Medir espesor y verificar ruidos anormales'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Battery Check',
    20000,
    365,
    'Chequeo de carga y estado de batería',
    'Medir voltaje y limpiar bornes'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Preventive Maintenance'),
    'Coolant System Flush',
    40000,
    730,
    'Limpieza y reemplazo de refrigerante cada 40,000 km o 2 años',
    'Drenar, enjuagar y rellenar con refrigerante aprobado'
),

-- Scheduled Service
(
    (SELECT id FROM maintenance_categories WHERE name = 'Scheduled Service'),
    '5,000 KM Service',
    5000,
    180,
    'Servicio general cada 5000 km',
    'Cambio de aceite y revisión básica'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Scheduled Service'),
    '10,000 KM Service',
    10000,
    365,
    'Servicio general cada 10000 km',
    'Incluye inspección de frenos y filtros'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Scheduled Service'),
    '20,000 KM Service',
    20000,
    730,
    'Servicio general mayor cada 20000 km',
    'Revisión de suspensión, transmisión y frenos'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Scheduled Service'),
    '50,000 KM Service',
    50000,
    1460,
    'Servicio mayor cada 50000 km',
    'Cambio de bujías, correas y fluidos principales'
),

-- Corrective Maintenance
(
    (SELECT id FROM maintenance_categories WHERE name = 'Corrective Maintenance'),
    'Brake Pad Replacement',
    30000,
    730,
    'Reemplazo de pastillas según desgaste',
    'Usar repuestos originales o equivalentes'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Corrective Maintenance'),
    'Tire Replacement',
    40000,
    1095,
    'Reemplazo de neumáticos por desgaste',
    'Alinear y balancear después del cambio'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Corrective Maintenance'),
    'Battery Replacement',
    60000,
    1460,
    'Reemplazo de batería defectuosa o vieja',
    'Configurar sistema eléctrico tras instalación'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Corrective Maintenance'),
    'Engine Tune-up',
    40000,
    1460,
    'Afinación general del motor',
    'Ajustar encendido, bujías y calibrar inyectores'
),

-- Emergency Repairs
(
    (SELECT id FROM maintenance_categories WHERE name = 'Emergency Repairs'),
    'Engine Repair',
    NULL,
    NULL,
    'Reparación en caso de fallas graves',
    'Diagnóstico completo y reparación según daño'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Emergency Repairs'),
    'Transmission Repair',
    NULL,
    NULL,
    'Reparación de transmisión en fallas críticas',
    'Reparación o reemplazo de componentes'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Emergency Repairs'),
    'Electrical System Repair',
    NULL,
    NULL,
    'Reparaciones eléctricas de emergencia',
    'Verificar fusibles, cableado y alternador'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Emergency Repairs'),
    'Accident Damage Repair',
    NULL,
    NULL,
    'Reparación por daños de accidentes',
    'Inspección estructural y de seguridad'
),

-- Safety Inspections
(
    (SELECT id FROM maintenance_categories WHERE name = 'Safety Inspections'),
    'Annual Safety Inspection',
    NULL,
    365,
    'Inspección de seguridad anual obligatoria',
    'Revisar frenos, luces y sistemas de seguridad'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Safety Inspections'),
    'Emissions Test',
    NULL,
    365,
    'Prueba de emisiones contaminantes',
    'Verificar niveles de CO2 y gases permitidos'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Safety Inspections'),
    'Brake System Check',
    10000,
    365,
    'Chequeo anual del sistema de frenos',
    'Revisar discos, pastillas y líquido de frenos'
),

-- Performance Upgrades
(
    (SELECT id FROM maintenance_categories WHERE name = 'Performance Upgrades'),
    'Performance Exhaust',
    NULL,
    NULL,
    'Instalación de escape de alto rendimiento',
    'Instalar sistema compatible y ajustar ECU'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Performance Upgrades'),
    'Suspension Upgrade',
    NULL,
    NULL,
    'Mejora de suspensión para mejor manejo',
    'Instalar kit deportivo o reforzado'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Performance Upgrades'),
    'ECU Tuning',
    NULL,
    NULL,
    'Optimización del rendimiento mediante software',
    'Reprogramar ECU con mapa personalizado'
),

-- Cosmetic Repairs
(
    (SELECT id FROM maintenance_categories WHERE name = 'Cosmetic Repairs'),
    'Paint Touch-up',
    NULL,
    NULL,
    'Corrección de pintura en zonas dañadas',
    'Utilizar pintura original del fabricante'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Cosmetic Repairs'),
    'Interior Cleaning',
    NULL,
    NULL,
    'Limpieza interior profunda',
    'Aspirado, limpieza de tapizados y plásticos'
),
(
    (SELECT id FROM maintenance_categories WHERE name = 'Cosmetic Repairs'),
    'Dent Removal',
    NULL,
    NULL,
    'Reparación de abolladuras menores',
    'Aplicar técnicas PDR (Paintless Dent Repair)'
);


-- =====================================================
-- INSERT VEHICLE ASSIGNMENTS
-- =====================================================

INSERT INTO
    assignments (
        user_id,
        vehicle_id,
        start_date,
        end_date
    )
VALUES
    -- Management gets newer vehicles (long-term assignments)
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        '2024-01-01',
        '2025-12-31'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'maria.gonzalez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        '2024-02-01',
        '2025-12-31'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'ana.martinez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'QRS345'
        ),
        '2024-01-15',
        NULL
    ),
    -- Operations team gets versatile vehicles (medium-term assignments)
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'juan.perez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        '2024-03-01',
        '2025-06-30'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'sofia.hernandez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'STU901'
        ),
        '2024-04-01',
        '2025-08-31'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'diego.garcia@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'VWX234'
        ),
        '2024-05-01',
        '2025-05-31'
    ),
    -- Field staff gets pickup trucks and vans (project-based assignments)
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'andres.morales@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'YZA567'
        ),
        '2024-06-01',
        '2025-03-31'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'miguel.vargas@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'EFG123'
        ),
        '2024-07-01',
        NULL
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'isabella.ruiz@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'HIJ456'
        ),
        '2024-08-01',
        '2025-07-31'
    ),
    -- Maintenance team gets compact vehicles for efficiency (short-term rotating assignments)
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'roberto.jimenez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'KLM789'
        ),
        '2024-09-01',
        '2025-02-28'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'lucia.castro@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'NOP012'
        ),
        '2024-10-01',
        '2025-04-30'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'fernando.romero@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'TUV678'
        ),
        '2024-11-01',
        NULL
    ),
    -- Some temporary assignments for testing different scenarios
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'valentina.silva@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'PQR678'
        ),
        '2025-01-01',
        '2025-03-31'
    ),
    -- Past assignment (already ended)
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'luis.lopez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'GHI789'
        ),
        '2024-01-01',
        '2024-12-31'
    );

-- =====================================================
-- INSERT MAINTENANCE SCHEDULES
-- =====================================================
-- Assign regular maintenance to all vehicles

INSERT INTO
    assigned_maintenances (
        vehicle_id,
        maintenance_id,
        kilometers_frequency,
        days_frequency,
        observations,
        instructions
    )
VALUES
    -- Oil changes every 5000km or 90 days
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Oil Change'
        ),
        5000,
        90,
    'Regular oil change',
    'Replace oil filter and drain old oil'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Oil Change'
        ),
    5000,
    90,
    'Regular oil change',
    'Replace oil filter and drain old oil'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'GHI789'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Oil Change'
        ),
    5000,
    90,
    'Regular oil change',
    'Replace oil filter and drain old oil'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'JKL012'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Oil Change'
        ),
    5000,
    90,
    'Regular oil change',
    'Replace oil filter and drain old oil'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Oil Change'
        ),
    5000,
    90,
    'Regular oil change',
    'Replace oil filter and drain old oil'
    ),
    -- Tire rotation every 10000km or 180 days
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Tire Rotation'
        ),
    10000,
    180,
    'Rotate tires for even wear',
    'Cross-rotate front and rear tires'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Tire Rotation'
        ),
    10000,
    180,
    'Rotate tires for even wear',
    'Cross-rotate front and rear tires'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Tire Rotation'
        ),
    10000,
    180,
    'Rotate tires for even wear',
    'Cross-rotate front and rear tires'
    ),
    -- Brake inspection every 20000km or 365 days
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Brake Inspection'
        ),
    20000,
    365,
    'Brake inspection',
    'Measure pad thickness and check for abnormal noises'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Brake Inspection'
        ),
    20000,
    365,
    'Brake inspection',
    'Measure pad thickness and check for abnormal noises'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Brake Inspection'
        ),
    20000,
    365,
    'Brake inspection',
    'Measure pad thickness and check for abnormal noises'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'YZA567'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Brake Inspection'
        ),
    15000,
    365,
    'Brake inspection',
    'Measure pad thickness and check for abnormal noises'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'BCD890'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Brake Inspection'
        ),
    15000,
    365,
    'Brake inspection',
    'Measure pad thickness and check for abnormal noises'
    ),
    -- Annual safety inspections
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Annual Safety Inspection'
        ),
    NULL,
    365,
    'Annual safety inspection',
    'Check brakes, lights and safety systems'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Annual Safety Inspection'
        ),
    NULL,
    365,
    'Annual safety inspection',
    'Check brakes, lights and safety systems'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Annual Safety Inspection'
        ),
    NULL,
    365,
    'Annual safety inspection',
    'Check brakes, lights and safety systems'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'QRS345'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Annual Safety Inspection'
        ),
    NULL,
    365,
    'Annual safety inspection',
    'Check brakes, lights and safety systems'
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'TUV678'
        ),
        (
            SELECT id
            FROM maintenances
            WHERE
                name = 'Annual Safety Inspection'
        ),
    NULL,
    365,
    'Annual safety inspection',
    'Check brakes, lights and safety systems'
    );

-- =====================================================
-- INSERT MAINTENANCE HISTORY
-- =====================================================
-- Recent maintenance records

INSERT INTO
    maintenance_records (
        assigned_maintenance_id,
        user_id,
        date,
        kilometers,
        notes
    )
VALUES
    -- Recent oil changes
    (
        (
            SELECT am.id
            FROM
                assigned_maintenances am
                JOIN vehicles v ON am.vehicle_id = v.id
                JOIN maintenances m ON am.maintenance_id = m.id
            WHERE
                v.license_plate = 'ABC123'
                AND m.name = 'Oil Change'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'roberto.jimenez@acacoop.com'
        ),
        '2024-12-15',
        45000,
        'Regular oil change. Used synthetic 5W-30. All levels checked.'
    ),
    (
        (
            SELECT am.id
            FROM
                assigned_maintenances am
                JOIN vehicles v ON am.vehicle_id = v.id
                JOIN maintenances m ON am.maintenance_id = m.id
            WHERE
                v.license_plate = 'DEF456'
                AND m.name = 'Oil Change'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'lucia.castro@acacoop.com'
        ),
        '2024-12-10',
        38000,
        'Oil change completed. Minor leak detected and repaired.'
    ),
    -- Tire rotations
    (
        (
            SELECT am.id
            FROM
                assigned_maintenances am
                JOIN vehicles v ON am.vehicle_id = v.id
                JOIN maintenances m ON am.maintenance_id = m.id
            WHERE
                v.license_plate = 'ABC123'
                AND m.name = 'Tire Rotation'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'fernando.romero@acacoop.com'
        ),
        '2024-11-20',
        42000,
        'Tire rotation completed. Front tires showing slight wear.'
    ),
    -- Brake inspections
    (
        (
            SELECT am.id
            FROM
                assigned_maintenances am
                JOIN vehicles v ON am.vehicle_id = v.id
                JOIN maintenances m ON am.maintenance_id = m.id
            WHERE
                v.license_plate = 'MNO345'
                AND m.name = 'Brake Inspection'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'roberto.jimenez@acacoop.com'
        ),
        '2024-10-15',
        35000,
        'Brake system inspection passed. Pads at 60% remaining.'
    ),
    -- Safety inspections
    (
        (
            SELECT am.id
            FROM
                assigned_maintenances am
                JOIN vehicles v ON am.vehicle_id = v.id
                JOIN maintenances m ON am.maintenance_id = m.id
            WHERE
                v.license_plate = 'QRS345'
                AND m.name = 'Annual Safety Inspection'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'lucia.castro@acacoop.com'
        ),
        '2024-09-01',
        28000,
        'Annual safety inspection completed successfully. All systems operational.'
    );

-- =====================================================
-- INSERT RESERVATIONS
-- =====================================================
-- Current and upcoming reservations

INSERT INTO
    reservations (
        user_id,
        vehicle_id,
        start_date,
        end_date
    )
VALUES
    -- Upcoming reservations
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'valentina.silva@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'GHI789'
        ),
        '2025-01-15',
        '2025-01-20'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'diego.garcia@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'JKL012'
        ),
        '2025-01-18',
        '2025-01-25'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'sofia.hernandez@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'KLM789'
        ),
        '2025-01-22',
        '2025-01-24'
    ),
    -- Extended reservations for projects
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'miguel.vargas@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'HIJ456'
        ),
        '2025-02-01',
        '2025-02-28'
    ),
    (
        (
            SELECT id
            FROM users
            WHERE
                email = 'camila.torres@acacoop.com'
        ),
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'EFG123'
        ),
        '2025-02-10',
        '2025-02-15'
    );

-- =====================================================
-- INSERT VEHICLE RESPONSIBLES
-- =====================================================
-- Assign responsibles to vehicles with different periods

INSERT INTO
    vehicle_responsibles (
        vehicle_id,
        user_id,
        start_date,
        end_date
    )
VALUES
    -- Management vehicles - long-term responsibles
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        '2024-01-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'maria.gonzalez@acacoop.com'
        ),
        '2024-02-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'QRS345'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'ana.martinez@acacoop.com'
        ),
        '2024-01-15',
        NULL -- Currently responsible
    ),
    -- Operations team - medium-term responsibles
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'juan.perez@acacoop.com'
        ),
        '2024-03-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'STU901'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'sofia.hernandez@acacoop.com'
        ),
        '2024-04-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'VWX234'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'diego.garcia@acacoop.com'
        ),
        '2024-05-01',
        NULL -- Currently responsible
    ),
    -- Field staff - project-based responsibles
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'YZA567'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'andres.morales@acacoop.com'
        ),
        '2024-06-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'EFG123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'miguel.vargas@acacoop.com'
        ),
        '2024-07-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'HIJ456'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'isabella.ruiz@acacoop.com'
        ),
        '2024-08-01',
        NULL -- Currently responsible
    ),
    -- Maintenance team - rotating responsibles
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'KLM789'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'roberto.jimenez@acacoop.com'
        ),
        '2024-09-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'NOP012'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'lucia.castro@acacoop.com'
        ),
        '2024-10-01',
        NULL -- Currently responsible
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'TUV678'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'fernando.romero@acacoop.com'
        ),
        '2024-11-01',
        NULL -- Currently responsible
    ),
    -- Some historical responsibles (ended periods)
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'GHI789'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'luis.lopez@acacoop.com'
        ),
        '2024-01-01',
        '2024-12-31' -- Ended responsibility
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'GHI789'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'valentina.silva@acacoop.com'
        ),
        '2025-01-01',
        NULL -- Currently responsible
    ),
    -- Vehicles with responsibility changes
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'JKL012'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'camila.torres@acacoop.com'
        ),
        '2024-01-01',
        '2024-06-30' -- Ended responsibility
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'JKL012'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'valentina.silva@acacoop.com'
        ),
        '2024-07-01',
        NULL -- Currently responsible
    ),
    -- Some vehicles without current responsibles for testing
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'PQR678'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'andres.morales@acacoop.com'
        ),
        '2024-01-01',
        '2024-12-31' -- Ended responsibility
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'BCD890'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'miguel.vargas@acacoop.com'
        ),
        '2024-01-01',
        '2024-11-30' -- Ended responsibility
    );

-- =====================================================
-- DATA VERIFICATION QUERIES
-- =====================================================
-- Uncomment the following to verify data was inserted correctly

-- SELECT 'Users' as table_name, count(*) as record_count FROM users
-- UNION ALL
-- SELECT 'Vehicles', count(*) FROM vehicles
-- UNION ALL
-- SELECT 'Maintenance Categories', count(*) FROM maintenance_categories
-- UNION ALL
-- SELECT 'Maintenances', count(*) FROM maintenances
-- UNION ALL
-- SELECT 'Assignments', count(*) FROM assignments
-- UNION ALL
-- SELECT 'Assigned Maintenances', count(*) FROM assigned_maintenances
-- UNION ALL
-- SELECT 'Maintenance Records', count(*) FROM maintenance_records
-- UNION ALL
-- SELECT 'Reservations', count(*) FROM reservations
-- UNION ALL
-- SELECT 'Vehicle Responsibles', count(*) FROM vehicle_responsibles;

-- Sample queries to test the data:
-- SELECT u.first_name, u.last_name, v.brand, v.model, v.license_plate
-- FROM assignments a
-- JOIN users u ON a.user_id = u.id
-- JOIN vehicles v ON a.vehicle_id = v.id
-- ORDER BY u.last_name;

-- =====================================================
-- INSERT VEHICLE KILOMETERS LOGS (Sample historical + out-of-order entries)
-- =====================================================
-- We add some chronological and back-dated entries to exercise validation logic.

INSERT INTO
    vehicle_kilometers (
        vehicle_id,
        user_id,
        date,
        kilometers
    )
VALUES
    -- Vehicle ABC123 progressive km
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        '2025-01-01T09:00:00Z',
        45500
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        '2025-01-10T09:00:00Z',
        46200
    ),
    -- A later entry
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        '2025-02-01T09:00:00Z',
        48050
    ),
    -- Back-dated insertion between first and second should still be valid if within range
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'ABC123'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'carlos.rodriguez@acacoop.com'
        ),
        '2025-01-05T09:00:00Z',
        45800
    ),
    -- Vehicle DEF456
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'juan.perez@acacoop.com'
        ),
        '2025-01-03T12:00:00Z',
        38600
    ),
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'DEF456'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'juan.perez@acacoop.com'
        ),
        '2025-02-03T12:00:00Z',
        40010
    ),
    -- Vehicle MNO345 sparse readings
    (
        (
            SELECT id
            FROM vehicles
            WHERE
                license_plate = 'MNO345'
        ),
        (
            SELECT id
            FROM users
            WHERE
                email = 'maria.gonzalez@acacoop.com'
        ),
        '2025-01-02T08:30:00Z',
        35200
    );