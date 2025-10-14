import { Entity, ManyToMany, PrimaryGeneratedColumn, JoinTable } from "typeorm";
import { Vehicle } from "./Vehicle";

@Entity({ name: "vehicle_selections" })
export class VehicleSelection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToMany(() => Vehicle)
  @JoinTable({
    name: "vehicle_selections_vehicles",
    joinColumn: { name: "vehicle_selection_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "vehicle_id", referencedColumnName: "id" },
  })
  vehicles!: Vehicle[];
}
