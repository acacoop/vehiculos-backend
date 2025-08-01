# Nuevos Endpoints de Asignaciones Implementados

## 1. Actualizar Asignación
**Endpoint:** `PATCH /assignments/{id}`

**Headers:**
```
Content-Type: application/json
```

**Body de ejemplo:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "vehicleId": "550e8400-e29b-41d4-a716-446655440001", 
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T00:00:00.000Z"
}
```

**Respuesta exitosa (200):**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T00:00:00.000Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Juan",
      "lastName": "Pérez",
      "dni": 12345678,
      "email": "juan.perez@example.com",
      "active": true
    },
    "vehicle": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "licensePlate": "ABC123",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2023,
      "imgUrl": "https://example.com/vehicle.jpg"
    }
  },
  "message": "Resource partially updated successfully"
}
```

## 2. Finalizar/Desasignar Vehículo
**Endpoint:** `PATCH /assignments/{id}/finish`

**Headers:**
```
Content-Type: application/json
```

**Body de ejemplo:**
```json
{
  "endDate": "2024-08-01T00:00:00.000Z"
}
```

**Nota:** Si no se proporciona `endDate`, se usará la fecha actual.

**Respuesta exitosa (200):**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-08-01T00:00:00.000Z",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Juan",
      "lastName": "Pérez",
      "dni": 12345678,
      "email": "juan.perez@example.com",
      "active": true
    },
    "vehicle": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "licensePlate": "ABC123",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2023,
      "imgUrl": "https://example.com/vehicle.jpg"
    }
  },
  "message": "Assignment finished successfully"
}
```

## Validaciones Implementadas

### 1. Validaciones de UUID
- Formato UUID v4 válido para `id`, `userId`, `vehicleId`

### 2. Validaciones de Fechas
- Formato ISO 8601 válido (YYYY-MM-DDTHH:mm:ss.sssZ)
- `endDate` debe ser posterior a `startDate`
- Las fechas deben ser válidas

### 3. Validaciones de Existencia
- Verificación de que la asignación existe antes de actualizar/finalizar
- Verificación de que el `userId` existe en la tabla `users`
- Verificación de que el `vehicleId` existe en la tabla `vehicles`

## Códigos de Respuesta

### Exitosos
- **200**: Operación exitosa
- **201**: Recurso creado exitosamente

### Errores del Cliente
- **400**: Datos inválidos (formato UUID, fechas, validaciones de negocio)
- **404**: Asignación no encontrada
- **405**: Método no permitido

### Errores del Servidor
- **500**: Error interno del servidor

## Ejemplos de Errores

### Error 400 - UUID Inválido
```json
{
  "status": "error",
  "message": "Invalid UUID format provided: invalid-uuid",
  "type": "https://example.com/problems/invalid-uuid",
  "title": "Invalid UUID Format"
}
```

### Error 404 - Asignación No Encontrada
```json
{
  "status": "error",
  "message": "Assignment with ID 550e8400-e29b-41d4-a716-446655440999 was not found",
  "type": "https://example.com/problems/resource-not-found",
  "title": "Resource Not Found"
}
```

### Error 400 - Fechas Inválidas
```json
{
  "status": "error",
  "message": "End date must be after start date.",
  "type": "https://example.com/problems/validation-error",
  "title": "Validation Error"
}
```

## Cambios en Archivos

### Archivos Modificados:
1. `src/services/vehicles/assignments.ts` - Nuevas funciones de servicio
2. `src/controllers/assignmentsController.ts` - Implementación de PATCH y finish
3. `src/routes/vehicles/assignments.ts` - Nuevas rutas
4. `src/middleware/validation.ts` - Middleware de validación
5. `src/schemas/assignment.ts` - Esquemas de validación actualizados

### Nuevas Funciones de Servicio:
- `getAssignmentWithDetailsById()` - Obtiene asignación con detalles completos
- `finishAssignment()` - Finaliza una asignación
- `updateAssignment()` - Actualiza asignación (mejorado con validaciones)
- `isValidISODate()` - Valida formato de fecha ISO

### Nuevos Middleware:
- `validateAssignmentUpdate` - Valida datos para actualización
- `validateAssignmentFinish` - Valida datos para finalización

## Pruebas Sugeridas

1. **Actualizar asignación completa** con todos los campos
2. **Actualizar asignación parcial** con solo algunos campos
3. **Finalizar asignación** con fecha específica
4. **Finalizar asignación** sin fecha (usa fecha actual)
5. **Probar validaciones** con UUIDs inválidos
6. **Probar validaciones** con fechas inválidas
7. **Probar casos de error** con asignaciones inexistentes
