import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";

import { VehicleModel } from "./VehicleModel";

@Entity({ name: "vehicles" })
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "license_plate", unique: true, length: 10 })
  licensePlate!: string;

  @ManyToOne(() => VehicleModel, { eager: true, onDelete: "SET NULL" })
  model!: VehicleModel;

  @Column()
  year!: number;

  @Column({ name: "chassis_number", nullable: true, length: 50 })
  chassisNumber?: string;

  @Column({ name: "engine_number", nullable: true, length: 50 })
  engineNumber?: string;

  @Column({ name: "vehicle_type", nullable: true, length: 50 })
  vehicleType?: string;

  @Column({ nullable: true, length: 50 })
  transmission?: string;

  @Column({ name: "fuel_type", nullable: true, length: 50 })
  fuelType?: string;
}
