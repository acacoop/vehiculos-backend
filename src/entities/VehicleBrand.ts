import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "vehicle_brands" })
export class VehicleBrand {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "name", type: "varchar", unique: true, length: 100 })
  name!: string;
}
