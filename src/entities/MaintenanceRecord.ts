import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { AssignedMaintenance } from "@/entities/AssignedMaintenance";
import { User } from "@/entities/User";

@Entity({ name: "maintenance_records" })
@Check("kilometers >= 0")
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
