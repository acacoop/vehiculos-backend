import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "@/entities/User";
import { Maintenance } from "./Maintenance";
import { Vehicle } from "./Vehicle";
import { VehicleKilometers } from "./VehicleKilometers";

@Entity({ name: "maintenance_records" })
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

  @ManyToOne(() => VehicleKilometers, {
    eager: true,
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "kilometers_log_id" })
  kilometersLog!: VehicleKilometers | null;

  @Column({ name: "notes", type: "text", nullable: true })
  notes!: string | null;
}
