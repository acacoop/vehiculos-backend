export interface MaintenanceRecord {
  id: number;
  assignedMaintenanceId: number;
  userId: number;
  date: Date;
  kilometer: number;
  observations: string;
}
