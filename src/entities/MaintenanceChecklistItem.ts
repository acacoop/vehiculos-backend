import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";

@Entity({ name: "maintenance_checklist_items" })
export class MaintenanceChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => MaintenanceChecklist, { onDelete: "CASCADE" })
  @JoinColumn({ name: "maintenance_checklist_id" })
  maintenanceChecklist!: MaintenanceChecklist;

  @Column({ default: false })
  passed!: boolean;

  @Column({ type: "text" })
  observations!: string;
}
