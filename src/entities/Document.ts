import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from "typeorm";
import { DocumentType } from "./DocumentType";
import { User } from "./User";
import { EntityTypeEnum } from "../enums";

@Entity({ name: "documents" })
@Check("expiration_date IS NULL OR expiration_date > start_date")
@Index(["entityType", "entityId", "documentType", "isCurrentVersion"])
@Index(["expirationDate"])
@Index(["uploadedBy"])
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => DocumentType, { eager: true, onDelete: "RESTRICT" })
  @JoinColumn({ name: "document_type_id" })
  documentType!: DocumentType;

  @Column({ name: "entity_type", type: "varchar", length: 50 })
  entityType!: EntityTypeEnum;

  @Column({ name: "entity_id", type: "varchar", length: 255 })
  entityId!: string;

  @ManyToOne(() => User, { eager: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "uploaded_by" })
  uploadedBy!: User | null;

  @Column({ name: "uploaded_at", type: "datetime", default: () => "GETDATE()" })
  uploadedAt!: Date;

  @Column({ name: "start_date", type: "date" })
  startDate!: string;

  @Column({ name: "expiration_date", type: "date", nullable: true })
  expirationDate!: string | null;

  @Column({ name: "file_path", type: "nvarchar", length: 500, nullable: true })
  filePath!: string | null;

  @Column({
    name: "file_storage_provider",
    type: "varchar",
    length: 50,
    default: "local",
  })
  fileStorageProvider!: string;

  @Column({ name: "is_current_version", type: "bit", default: true })
  isCurrentVersion!: boolean;

  @ManyToOne(() => Document, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "replaced_by" })
  replacedBy!: Document | null;

  @Column({ name: "notes", type: "nvarchar", length: 1000, nullable: true })
  notes!: string | null;

  @Column({ name: "is_active", type: "bit", default: true })
  isActive!: boolean;
}
