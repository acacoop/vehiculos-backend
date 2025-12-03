import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { QuarterlyControl } from "@/entities/QuarterlyControl";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

@Entity({ name: "quarterly_control_items" })
export class QuarterlyControlItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne("QuarterlyControl", { onDelete: "CASCADE" })
  @JoinColumn({ name: "quarterly_control_id" })
  quarterlyControl!: QuarterlyControl;

  @Column({ name: "category", type: "nvarchar", length: 100 })
  category!: string;

  @Column({ name: "title", type: "nvarchar", length: 255 })
  title!: string;

  @Column({
    name: "status",
    type: "nvarchar",
    length: 50,
    default: QuarterlyControlItemStatus.PENDIENTE,
  })
  status!: QuarterlyControlItemStatus;

  @Column({ name: "observations", type: "text" })
  observations!: string;
}
