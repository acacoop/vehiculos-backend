import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from "typeorm";
import { Vehicle } from "./Vehicle";

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

  @Column({
    type: "enum",
    enum: PermissionType,
    name: "permission",
  })
  permission!: PermissionType;

  @ManyToMany(() => Vehicle)
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

  @Column({ name: "start_ceco", length: 8 })
  startCeco!: number;

  @Column({ name: "end_ceco", length: 8 })
  endCeco!: number;
}
