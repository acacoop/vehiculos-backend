import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "maintenance_categories" })
export class MaintenanceCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;
}
