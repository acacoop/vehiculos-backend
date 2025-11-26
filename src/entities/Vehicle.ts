import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";

import { VehicleModel } from "@/entities/VehicleModel";

@Entity({ name: "vehicles" })
@Index(["licensePlate"])
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "license_plate", type: "varchar", unique: true, length: 10 })
  licensePlate!: string;

  @ManyToOne(() => VehicleModel, { eager: true, onDelete: "SET NULL" })
  model!: VehicleModel;

  @Column({ type: "int" })
  year!: number;

  @Column({
    name: "chassis_number",
    type: "varchar",
    nullable: true,
    length: 50,
  })
  chassisNumber?: string;

  @Column({
    name: "engine_number",
    type: "varchar",
    nullable: true,
    length: 50,
  })
  engineNumber?: string;

  @Column({ name: "vehicle_type", type: "varchar", length: 50, nullable: true })
  vehicleType?: string;

  @Column({ type: "varchar", nullable: true, length: 50 })
  transmission?: string;

  @Column({ name: "fuel_type", type: "varchar", nullable: true, length: 50 })
  fuelType?: string;
}
