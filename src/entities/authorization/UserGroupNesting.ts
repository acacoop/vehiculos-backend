import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserGroup } from "./UserGroup";

@Entity({ name: "user_group_nestings" })
export class UserGroupNesting {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => UserGroup, { onDelete: "CASCADE" })
  @JoinColumn({ name: "parent_group_id" })
  parentGroup!: UserGroup;

  @ManyToOne(() => UserGroup, { onDelete: "CASCADE" })
  @JoinColumn({ name: "child_group_id" })
  childGroup!: UserGroup;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;
}
