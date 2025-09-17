import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "vehicles" })
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "license_plate", unique: true })
  licensePlate!: string;

  @Column()
  brand!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;

  @Column({ name: "chassis_number", nullable: true })
  chassisNumber?: string;

  @Column({ name: "engine_number", nullable: true })
  engineNumber?: string;

  @Column({ name: "vehicle_type", nullable: true })
  vehicleType?: string;

  @Column({ nullable: true })
  transmission?: string;

  @Column({ name: "fuel_type", nullable: true })
  fuelType?: string;
}
