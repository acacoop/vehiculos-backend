import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { VehicleBrand } from "./VehicleBrand";

@Entity({ name: "vehicle_models" })
export class VehicleModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => VehicleBrand, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "brand_id" })
  brand!: VehicleBrand;

  @Column({ name: "name", unique: true, length: 100 })
  name!: string;

  @Column({ name: "vehicle_type", nullable: true })
  vehicleType?: string;
}
