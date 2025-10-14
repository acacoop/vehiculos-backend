import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  Column,
  OneToOne,
  Check,
  Index,
} from "typeorm";
import { PermissionType } from "./PermissionType";
import { VehicleSelection } from "./VehicleSelection";

export enum ACLType {
  USER = "user",
  USER_GROUP = "user_group",
}

@Entity({ name: "vehicle_acl" })
@Check("end_time IS NULL OR end_time > start_time")
@Index(["entityId", "aclType"])
export class VehicleACL {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 20,
    name: "acl_type",
  })
  aclType!: ACLType;

  @Column({ name: "entity_id" })
  entityId!: string;

  @Column({
    type: "varchar",
    length: 20,
    name: "permission",
    default: PermissionType.READ,
  })
  permission!: PermissionType;

  @OneToOne(() => VehicleSelection, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_selection_id" })
  vehicleSelection!: VehicleSelection;

  @Column({ name: "start_time", type: "datetime" })
  startTime!: Date;

  @Column({ name: "end_time", type: "datetime", nullable: true })
  endTime?: Date;
}
