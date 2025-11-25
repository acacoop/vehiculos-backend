# WebJobs

Este directorio contiene los WebJobs que se ejecutan en Azure App Service.

## WebJobs disponibles

### 1. quarterly-checklists
Genera checklists de mantenimiento trimestrales para todos los vehículos activos.

- **Frecuencia**: Trimestral (1 de enero, abril, julio, octubre a las 00:00 UTC)
- **Cron**: `0 0 1 1,4,7,10 *`
- **Script**: `npm run generate-checklists`

### 2. sync-entra-users
Sincroniza usuarios de Microsoft Entra ID (Azure AD) con la base de datos local.

- **Frecuencia**: Diaria (02:00 UTC)
- **Cron**: `0 2 * * *`
- **Script**: `npm run sync`

## Despliegue

### Desplegar todos los WebJobs
```bash
make deploy-webjobs ENV=test
# o
make deploy-webjobs ENV=prod
```

### Desplegar un WebJob específico
```bash
make deploy-webjob NAME=quarterly-checklists ENV=test
# o
make deploy-webjob NAME=sync-entra-users ENV=prod
```

## Estructura de un WebJob

Cada WebJob debe tener:
- `run.sh` - Script ejecutable que se ejecuta
- `settings.job` - Configuración del schedule (opcional para triggered jobs)

## Formato Cron

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-7, 0 y 7 = domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

## Ejecución manual

Para ejecutar localmente:
```bash
cd webjobs/quarterly-checklists
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
