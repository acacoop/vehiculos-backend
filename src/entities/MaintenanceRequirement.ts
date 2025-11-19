import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { VehicleModel } from "@/entities/VehicleModel";
import { Maintenance } from "@/entities/Maintenance";

@Entity({ name: "maintenances_requirements" })
@Check("(kilometers_frequency IS NULL OR kilometers_frequency > 0)")
@Check("(days_frequency IS NULL OR days_frequency > 0)")
@Check("end_date IS NULL OR end_date >= start_date")
export class MaintenanceRequirement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => VehicleModel, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "model_id" })
  model!: VehicleModel;

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

  @Column({ name: "start_date", type: "date" })
  startDate!: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate!: string | null;
}
