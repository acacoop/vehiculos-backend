import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { VehicleSelection } from "./VehicleSelection";

@Entity({ name: "ceco_ranges" })
export class CecoRange {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => VehicleSelection, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_selection_id" })
  vehicleSelection!: VehicleSelection;

  @Column({ name: "start_ceco", length: 8 })
  startCeco!: number;

  @Column({ name: "end_ceco", length: 8 })
  endCeco!: number;
}
