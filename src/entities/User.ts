import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "users" })
@Index(["email"])
@Index(["cuit"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "first_name", type: "nvarchar", length: 100 })
  firstName!: string;

  @Column({ name: "last_name", type: "nvarchar", length: 100 })
  lastName!: string;

  @Column({ name: "cuit", type: "nvarchar", unique: true, length: 14 })
  cuit!: string;

  @Column({ name: "email", type: "nvarchar", unique: true, length: 255 })
  email!: string;

  @Column({ name: "active", type: "bit", default: true })
  active!: boolean;

  @Column({ name: "entra_id", type: "nvarchar", length: 255, default: "" })
  entraId!: string;
}
