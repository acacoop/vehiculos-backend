import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from "typeorm";
import { UserGroup } from "./UserGroup";
import { User } from "../User";

@Entity({ name: "user_group_memberships" })
export class UserGroupMembership {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => UserGroup, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_group_id" })
  userGroup!: UserGroup;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;
}
