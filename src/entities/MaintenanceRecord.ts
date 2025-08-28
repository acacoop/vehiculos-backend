import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AssignedMaintenance } from "./AssignedMaintenance";
import { User } from "./User";

@Entity({ name: "maintenance_records" })
export class MaintenanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => AssignedMaintenance, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "assigned_maintenance_id" })
  assignedMaintenance!: AssignedMaintenance;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "int" })
  kilometers!: number;

  @Column({ type: "text", nullable: true })
  notes!: string | null;
}
