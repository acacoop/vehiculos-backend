import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { User } from "./User";
import { UserRoleEnum } from "../utils/common";

@Entity({ name: "user_roles" })
@Check("end_time IS NULL OR end_time > start_time")
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 20, default: UserRoleEnum.USER })
  role!: UserRoleEnum;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;
}
