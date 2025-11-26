import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";

@Entity({ name: "maintenances" })
@Check("(kilometers_frequency IS NULL OR kilometers_frequency > 0)")
@Check("(days_frequency IS NULL OR days_frequency > 0)")
export class Maintenance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => MaintenanceCategory, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: MaintenanceCategory;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ name: "kilometers_frequency", type: "int", nullable: true })
  kilometersFrequency!: number | null;

  @Column({ name: "days_frequency", type: "int", nullable: true })
  daysFrequency!: number | null;

  @Column({ type: "text", nullable: true })
  observations!: string | null;

  @Column({ type: "text", nullable: true })
  instructions!: string | null;
}
