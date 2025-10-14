import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  JoinColumn,
  Check,
  Index,
} from "typeorm";
import { Vehicle } from "./Vehicle";
import { User } from "./User";

@Entity({ name: "vehicle_kilometers" })
@Unique(["vehicle", "date"]) // mirror unique (vehicle_id, date)
@Check("kilometers >= 0")
@Index(["vehicle", "date"])
export class VehicleKilometers {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "datetime", name: "date" })
  date!: Date;

  @Column({ type: "int" })
  kilometers!: number;

  @Column({ name: "created_at", type: "datetime", default: () => "GETDATE()" })
  createdAt!: Date;
}
