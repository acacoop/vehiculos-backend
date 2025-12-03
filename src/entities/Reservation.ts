import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
  Check,
  Index,
} from "typeorm";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";

@Entity({ name: "reservations" })
@Check("end_date > start_date")
@Index(["startDate"])
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "start_date", type: "datetime" })
  startDate!: string;

  @Column({ name: "end_date", type: "datetime" })
  endDate!: string;
}
