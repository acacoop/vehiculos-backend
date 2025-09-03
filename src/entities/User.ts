import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "first_name" })
  firstName!: string;

  @Column({ name: "last_name" })
  lastName!: string;

  @Column({ unique: true })
  dni!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: "entra_id", default: "" })
  entraId!: string;
}
