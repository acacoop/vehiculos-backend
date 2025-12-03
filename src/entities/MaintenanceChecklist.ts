import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
} from "typeorm";
import { Vehicle } from "@/entities/Vehicle";
import { User } from "@/entities/User";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import type { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";

@Entity({ name: "maintenance_checklists" })
@Check("quarter IN (1,2,3,4)")
export class MaintenanceChecklist {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "year", type: "int" })
  year!: number;

  @Column({ name: "quarter", type: "int" })
  quarter!: number;

  @Column({ name: "intended_delivery_date", type: "date" })
  intendedDeliveryDate!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "filled_by" })
  filledBy!: User | null;

  @Column({ name: "filled_at", type: "date", nullable: true })
  filledAt!: string | null;

  @ManyToOne(() => VehicleKilometers, {
    eager: true,
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "kilometers_log_id" })
  kilometersLog!: VehicleKilometers | null;

  @OneToMany("MaintenanceChecklistItem", "maintenanceChecklist")
  items!: MaintenanceChecklistItem[];
}
