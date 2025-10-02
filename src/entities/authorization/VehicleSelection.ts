import { Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Vehicle } from "../Vehicle";

@Entity({ name: "vehicle_selections" })
export class VehicleSelection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToMany(() => Vehicle)
  vehicles!: Vehicle[];
}
