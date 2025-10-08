import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from "typeorm";
import { Vehicle } from "./Vehicle";

// If this entity is still used, switch to varchar for MSSQL compatibility.
export enum PermissionType {
  FULL = "Full",
  DRIVER = "Driver",
  MAINTAINER = "Maintainer",
  READ = "Read",
}

@Entity({ name: "roles" })
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 20, name: "permission" })
  permission!: PermissionType;

  @ManyToMany(() => Vehicle)
  @JoinTable({
    name: "roles_vehicles",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "vehicle_id", referencedColumnName: "id" },
  })
  vehicles!: Vehicle[];

  @OneToMany(() => CecoRange, (cecoRange) => cecoRange.role, { cascade: true })
  cecoRanges!: CecoRange[];
}

@Entity({ name: "ceco_ranges" })
export class CecoRange {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Role, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ name: "start_ceco", type: "int" })
  startCeco!: number;

  @Column({ name: "end_ceco", type: "int" })
  endCeco!: number;
}
