import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../User";

export enum UserRoleEnum {
  USER = "user",
  ADMIN = "admin",
}

export const USER_ROLES_WEIGHT: Record<UserRoleEnum, number> = {
  [UserRoleEnum.USER]: 1,
  [UserRoleEnum.ADMIN]: 2,
};

@Entity({ name: "user_roles" })
export class UserRole {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "enum", enum: UserRoleEnum, default: UserRoleEnum.USER })
  role!: UserRoleEnum;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;
}
