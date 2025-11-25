import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

@Entity({ name: "maintenance_checklist_items" })
export class MaintenanceChecklistItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => MaintenanceChecklist, { onDelete: "CASCADE" })
  @JoinColumn({ name: "maintenance_checklist_id" })
  maintenanceChecklist!: MaintenanceChecklist;

  @Column({ type: "nvarchar", length: 100 })
  category!: string;

  @Column({ type: "nvarchar", length: 255 })
  title!: string;

  @Column({
    type: "nvarchar",
    length: 50,
    default: MaintenanceChecklistItemStatus.PENDIENTE,
  })
  status!: MaintenanceChecklistItemStatus;

  @Column({ type: "text" })
  observations!: string;
}
