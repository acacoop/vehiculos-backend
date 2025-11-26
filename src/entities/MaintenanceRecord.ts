import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { User } from "@/entities/User";
import { Maintenance } from "./Maintenance";
import { Vehicle } from "./Vehicle";

@Entity({ name: "maintenance_records" })
@Check("kilometers >= 0")
export class MaintenanceRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Maintenance, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "maintenance_id" })
  maintenance!: Maintenance;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "date", type: "date" })
  date!: string;

  @Column({ name: "kilometers", type: "int" })
  kilometers!: number;

  @Column({ name: "notes", type: "text", nullable: true })
  notes!: string | null;
}
