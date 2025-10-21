import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "users" })
@Index(["email"])
@Index(["cuit"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "first_name", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", length: 100 })
  lastName!: string;

  @Column({ name: "cuit", unique: true, length: 14 })
  cuit!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: "entra_id", default: "" })
  entraId!: string;
}
