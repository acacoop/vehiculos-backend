import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { MaintenanceCategory } from "./MaintenanceCategory";

@Entity({ name: "maintenances" })
export class Maintenance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => MaintenanceCategory, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: MaintenanceCategory;

  @Column()
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
