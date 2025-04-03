-- Insertar categorías de mantenimiento
INSERT INTO maintenance_category (name) VALUES 
('Mantenimiento del Motor'),
('Mantenimiento del Sistema de Transmisión'),
('Mantenimiento del Sistema de Frenos'),
('Mantenimiento del Sistema de Suspensión y Dirección'),
('Mantenimiento de las Ruedas y Neumáticos'),
('Mantenimiento del Sistema de Enfriamiento'),
('Mantenimiento del Sistema Eléctrico'),
('Mantenimiento del Sistema de Escape'),
('Mantenimiento del Sistema de Climatización'),
('Mantenimiento General y Preventivo');
 
-- Insertar mantenimientos en cada categoría
INSERT INTO maintenance (category_id, name, img_name) VALUES
-- Mantenimiento del Motor
(1, 'Cambio de aceite y filtro', 'cambio_aceite.jpg'),
(1, 'Revisión y cambio de bujías', 'cambio_bujias.jpg'),
(1, 'Limpieza del cuerpo de aceleración', 'limpieza_aceleracion.jpg'),
(1, 'Revisión y cambio de correas', 'cambio_correas.jpg'),
(1, 'Inspección del sistema de refrigeración', 'inspeccion_refrigeracion.jpg'),
(1, 'Cambio de filtro de aire', 'cambio_filtro_aire.jpg'),
(1, 'Cambio de filtro de combustible', 'cambio_filtro_combustible.jpg'),
 
-- Mantenimiento del Sistema de Transmisión
(2, 'Cambio de aceite de transmisión', 'cambio_aceite_transmision.jpg'),
(2, 'Revisión y ajuste del embrague', 'ajuste_embrague.jpg'),
(2, 'Inspección de retenes y fugas', 'inspeccion_fugas_transmision.jpg'),
 
-- Mantenimiento del Sistema de Frenos
(3, 'Cambio de pastillas de freno', 'cambio_pastillas_freno.jpg'),
(3, 'Cambio o rectificación de discos', 'cambio_discos_freno.jpg'),
(3, 'Cambio de líquido de frenos', 'cambio_liquido_frenos.jpg'),
(3, 'Inspección de cilindros de freno', 'inspeccion_cilindros_freno.jpg'),
 
-- Mantenimiento del Sistema de Suspensión y Dirección
(4, 'Cambio de amortiguadores', 'cambio_amortiguadores.jpg'),
(4, 'Revisión de rótulas y terminales', 'revision_rotulas.jpg'),
(4, 'Alineación y balanceo de ruedas', 'alineacion_balanceo.jpg'),
(4, 'Revisión de bujes y soportes', 'revision_bujes.jpg'),
 
-- Mantenimiento de las Ruedas y Neumáticos
(5, 'Revisión de la presión de neumáticos', 'revision_presion.jpg'),
(5, 'Rotación de neumáticos', 'rotacion_neumaticos.jpg'),
(5, 'Cambio de neumáticos', 'cambio_neumaticos.jpg'),
 
-- Mantenimiento del Sistema de Enfriamiento
(6, 'Cambio de refrigerante', 'cambio_refrigerante.jpg'),
(6, 'Limpieza del radiador', 'limpieza_radiador.jpg'),
(6, 'Inspección del ventilador y termostato', 'revision_ventilador.jpg'),
 
-- Mantenimiento del Sistema Eléctrico
(7, 'Revisión y cambio de batería', 'cambio_bateria.jpg'),
(7, 'Inspección del alternador', 'revision_alternador.jpg'),
(7, 'Revisión de luces', 'revision_luces.jpg'),
(7, 'Cambio de fusibles', 'cambio_fusibles.jpg'),
 
-- Mantenimiento del Sistema de Escape
(8, 'Revisión del tubo de escape', 'revision_escape.jpg'),
(8, 'Inspección del catalizador', 'revision_catalizador.jpg'),
(8, 'Revisión del sensor de oxígeno', 'revision_sensor_oxigeno.jpg'),
 
-- Mantenimiento del Sistema de Climatización
(9, 'Carga y mantenimiento del aire acondicionado', 'carga_aire.jpg'),
(9, 'Cambio de filtro de habitáculo', 'cambio_filtro_habitaculo.jpg'),
(9, 'Revisión del compresor', 'revision_compresor.jpg'),
 
-- Mantenimiento General y Preventivo
(10, 'Lubricación de bisagras y cerraduras', 'lubricacion_bisagras.jpg'),
(10, 'Inspección del chasis y carrocería', 'inspeccion_chasis.jpg'),
(10, 'Revisión del sistema de seguridad', 'revision_seguridad.jpg'),
(10, 'Inspección de fugas de fluidos', 'inspeccion_fugas_fluidos.jpg');