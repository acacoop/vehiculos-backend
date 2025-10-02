import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "user_groups" })
export class UserGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;
}
