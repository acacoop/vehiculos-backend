import { DocumentType } from "@/entities/DocumentType";
import { DocumentTypeEnum, EntityTypeEnum } from "@/enums";

export interface IDocumentTypeRepository {
  findAll(): Promise<DocumentType[]>;
  findOne(id: string): Promise<DocumentType | null>;
  findByCode(code: DocumentTypeEnum): Promise<DocumentType | null>;
  findByEntityType(entityType: EntityTypeEnum): Promise<DocumentType[]>;
  create(data: Partial<DocumentType>): DocumentType;
  save(entity: DocumentType): Promise<DocumentType>;
}
