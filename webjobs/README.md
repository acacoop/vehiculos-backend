# WebJobs

Este directorio contiene los WebJobs que se ejecutan en Azure App Service.

## WebJobs disponibles

### 1. quarterly-controls
Genera controles trimestrales para todos los vehículos activos.

- **Frecuencia**: Trimestral (1 de enero, abril, julio, octubre a las 00:00 UTC)
- **Cron**: `0 0 0 1 1,4,7,10 *`
- **Script**: `node dist/scripts/generateQuarterlyControls.js`

### 2. sync-entra-users
Sincroniza usuarios de Microsoft Entra ID (Azure AD) con la base de datos local.

- **Frecuencia**: Diaria (02:00 UTC)
- **Cron**: `0 0 2 * * *`
- **Script**: `node dist/scripts/syncEntraUsers.js`

## Despliegue

Los WebJobs se despliegan como archivos `.sh` individuales que ejecutan el código JavaScript compilado.

### Preparar WebJobs
```bash
make prepare-webjobs
```

Esto copia los scripts a `webjobs-deploy/` con los permisos correctos:
- `quarterly-controls.sh`
- `sync-entra-users.sh`

### Desplegar manualmente con Azure CLI

```bash
# Subir WebJob triggered (scheduled)
az webapp deployment source config-zip \
  --resource-group RSG_FlotaVehiculos \
  --name app-vehiculos-api-test \
  --src webjobs-deploy/sync-entra-users.zip \
  --target "site/wwwroot/App_Data/jobs/triggered/sync-entra-users"
```

## Estructura de un WebJob

Cada WebJob debe tener:
- `run.sh` - Script ejecutable que se ejecuta
- `settings.job` - Configuración del schedule (opcional para triggered jobs)

## Formato Cron

Azure WebJobs usa **NCRONTAB** (6 campos):

```
{second} {minute} {hour} {day} {month} {day-of-week}

* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─── Día de la semana (0-6, 0 = domingo)
│ │ │ │ └───── Mes (1-12)
│ │ │ └─────── Día del mes (1-31)
│ │ └───────── Hora (0-23)
│ └─────────── Minuto (0-59)
└───────────── Segundo (0-59)
```

## Ejecución manual

Para ejecutar localmente:
```bash
cd webjobs/quarterly-controls
bash run.sh
```

## Ver logs en Azure

```bash
# Ver logs en tiempo real
az webapp log tail -g RSG_FlotaVehiculos -n app-vehiculos-api-test

# Descargar logs
az webapp log download -g RSG_FlotaVehiculos -n app-vehiculos-api-test
```

## Referencias

- [Azure WebJobs Documentation](https://learn.microsoft.com/en-us/azure/app-service/webjobs-create)
- [CRON Expression Reference](https://learn.microsoft.com/en-us/azure/app-service/webjobs-create#ncrontab-expressions)
