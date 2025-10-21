import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { Vehicle } from "@/entities/Vehicle";
import { User } from "@/entities/User";

const DEFAULT_CECO = "99999999"; // For already existing records without ceco

@Entity({ name: "vehicle_responsibles" })
@Check("end_date IS NULL OR end_date > start_date")
export class VehicleResponsible {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "ceco", length: 8, default: DEFAULT_CECO })
  ceco!: string;

  @Column({ name: "start_date", type: "date", default: () => "GETDATE()" })
  startDate!: string;

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate!: string | null;

  @Column({ name: "created_at", type: "datetime", default: () => "GETDATE()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "datetime", default: () => "GETDATE()" })
  updatedAt!: Date;
}
