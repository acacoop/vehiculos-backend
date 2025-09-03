import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "vehicles" })
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "license_plate", unique: true })
  licensePlate!: string;

  @Column()
  brand!: string;

  @Column()
  model!: string;

  @Column()
  year!: number;
}
