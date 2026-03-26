import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { DocumentTypeEnum, EntityTypeEnum } from "../enums";

@Entity({ name: "document_types" })
@Index(["code"], { unique: true })
export class DocumentType {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "code", type: "varchar", length: 50, unique: true })
  code!: DocumentTypeEnum;

  @Column({ name: "name", type: "nvarchar", length: 100 })
  name!: string;

  @Column({
    name: "description",
    type: "nvarchar",
    length: 500,
    nullable: true,
  })
  description!: string | null;

  @Column({ name: "entity_type", type: "varchar", length: 50 })
  entityType!: EntityTypeEnum;

  @Column({ name: "has_expiration", type: "bit", default: false })
  hasExpiration!: boolean;

  @Column({ name: "requires_file", type: "bit", default: true })
  requiresFile!: boolean;

  @Column({ name: "is_active", type: "bit", default: true })
  isActive!: boolean;
}
