import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "users" })
@Index(["email"])
@Index(["cuit"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "first_name", type: "varchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 100 })
  lastName!: string;

  @Column({ name: "cuit", type: "varchar", unique: true, length: 14 })
  cuit!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  email!: string;

  @Column({ type: "bit", default: true })
  active!: boolean;

  @Column({ name: "entra_id", type: "varchar", default: "" })
  entraId!: string;
}
