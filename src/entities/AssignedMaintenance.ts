import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Vehicle } from "./Vehicle";
import { Maintenance } from "./Maintenance";

@Entity({ name: "assigned_maintenances" })
export class AssignedMaintenance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @ManyToOne(() => Maintenance, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "maintenance_id" })
  maintenance!: Maintenance;

  @Column({ name: "kilometers_frequency", type: "int", nullable: true })
  kilometersFrequency!: number | null;

  @Column({ name: "days_frequency", type: "int", nullable: true })
  daysFrequency!: number | null;

  @Column({ type: "text", nullable: true })
  observations!: string | null;

  @Column({ type: "text", nullable: true })
  instructions!: string | null;
}
