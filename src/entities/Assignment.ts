import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  Unique,
  JoinColumn,
} from "typeorm";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";

@Entity({ name: "assignments" })
@Unique(["user", "vehicle"])
export class Assignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({ name: "start_date", type: "datetime", default: () => "GETDATE()" })
  startDate!: string;

  @Column({ name: "end_date", type: "datetime", nullable: true })
  endDate!: string | null;
}
