import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  ManyToOne,
  Check,
  Index,
} from "typeorm";
import { PermissionType } from "../utils/common";
import { User } from "./User";
import { Vehicle } from "./Vehicle";

@Entity({ name: "vehicle_acl" })
@Check("end_time IS NULL OR end_time > start_time")
@Index(["user", "vehicle"])
export class VehicleACL {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Vehicle, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle!: Vehicle;

  @Column({
    type: "varchar",
    length: 20,
    name: "permission",
    default: PermissionType.READ,
  })
  permission!: PermissionType;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date | null;
}
