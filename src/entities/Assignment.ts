import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Vehicle } from "./Vehicle";

@Entity({ name: "assignments" })
@Unique(["user", "vehicle"]) // mirrors unique (user_id, vehicle_id)
export class Assignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "start_date", type: "date", default: () => "GETDATE()" })
  startDate!: string; // ISO date

  @Column({ name: "end_date", type: "date", nullable: true })
  endDate!: string | null;
}
