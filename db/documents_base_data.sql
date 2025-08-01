-- =====================================================
-- DOCUMENTS BASE DATA
-- =====================================================
-- This file contains the foundational data required for
-- the documents management system to function properly.
-- This includes entity types, document types, and their
-- required file definitions.
--
-- Run with: psql -d database_name -f documents_base_data.sql

-- =====================================================
-- INSERT ENTITY TYPES
-- =====================================================
-- Define the types of entities that can have documents

INSERT INTO
    entity_types (name)
VALUES ('User'),
    ('Vehicle') ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INSERT DOCUMENT TYPES FOR USERS
-- =====================================================
-- Define what types of documents users must have

INSERT INTO
    document_types (name, entity_type_id)
VALUES (
        'Licencia de Conducir',
        (
            SELECT id
            FROM entity_types
            WHERE
                name = 'User'
        )
    ),
    (
        'Documento Nacional de Identidad',
        (
            SELECT id
            FROM entity_types
            WHERE
                name = 'User'
        )
    ) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INSERT DOCUMENT TYPES FOR VEHICLES
-- =====================================================
-- Define what types of documents vehicles must have

INSERT INTO
    document_types (name, entity_type_id)
VALUES (
        'Póliza de Seguro',
        (
            SELECT id
            FROM entity_types
            WHERE
                name = 'Vehicle'
        )
    ),
    (
        'Verificación Técnica Vehicular',
        (
            SELECT id
            FROM entity_types
            WHERE
                name = 'Vehicle'
        )
    ),
    (
        'Manual del Vehículo',
        (
            SELECT id
            FROM entity_types
            WHERE
                name = 'Vehicle'
        )
    ) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- INSERT REQUIRED FILES FOR USER DOCUMENTS
-- =====================================================

-- Files required for Licencia de Conducir
INSERT INTO
    document_type_files (document_type_id, name)
VALUES (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Licencia de Conducir'
        ),
        'Frente de la Licencia'
    ),
    (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Licencia de Conducir'
        ),
        'Dorso de la Licencia'
    ) ON CONFLICT (document_type_id, name) DO NOTHING;

-- Files required for Documento Nacional de Identidad
INSERT INTO
    document_type_files (document_type_id, name)
VALUES (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Documento Nacional de Identidad'
        ),
        'Frente del DNI'
    ),
    (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Documento Nacional de Identidad'
        ),
        'Dorso del DNI'
    ) ON CONFLICT (document_type_id, name) DO NOTHING;

-- =====================================================
-- INSERT REQUIRED FILES FOR VEHICLE DOCUMENTS
-- =====================================================

-- Files required for Póliza de Seguro
INSERT INTO
    document_type_files (document_type_id, name)
VALUES (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Póliza de Seguro'
        ),
        'Póliza Original'
    ) ON CONFLICT (document_type_id, name) DO NOTHING;

-- Files required for Verificación Técnica Vehicular
INSERT INTO
    document_type_files (document_type_id, name)
VALUES (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Verificación Técnica Vehicular'
        ),
        'Certificado VTV'
    ) ON CONFLICT (document_type_id, name) DO NOTHING;

-- Files required for Manual del Vehículo
INSERT INTO
    document_type_files (document_type_id, name)
VALUES (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Manual del Vehículo'
        ),
        'Manual PDF'
    ),
    (
        (
            SELECT id
            FROM document_types
            WHERE
                name = 'Manual del Vehículo'
        ),
        'Guía de Mantenimiento'
    ) ON CONFLICT (document_type_id, name) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify the base data was inserted correctly:

-- SELECT 'Entity Types' as category, count(*) as count FROM entity_types
-- UNION ALL
-- SELECT 'Document Types', count(*) FROM document_types
-- UNION ALL
-- SELECT 'Document Type Files', count(*) FROM document_type_files;

-- Show complete document structure:
-- SELECT
--     et.name as entity_type,
--     dt.name as document_type,
--     dtf.name as required_file
-- FROM entity_types et
-- JOIN document_types dt ON et.id = dt.entity_type_id
-- JOIN document_type_files dtf ON dt.id = dtf.document_type_id
-- ORDER BY et.name, dt.name, dtf.name;