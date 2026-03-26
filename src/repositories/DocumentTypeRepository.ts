import { DataSource, Repository } from "typeorm";
import { DocumentType } from "@/entities/DocumentType";
import { DocumentTypeEnum, EntityTypeEnum } from "@/enums";
import { IDocumentTypeRepository } from "@/repositories/interfaces/IDocumentTypeRepository";

export class DocumentTypeRepository implements IDocumentTypeRepository {
  private readonly repo: Repository<DocumentType>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(DocumentType);
  }

  async findAll(): Promise<DocumentType[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }

  async findOne(id: string): Promise<DocumentType | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByCode(code: DocumentTypeEnum): Promise<DocumentType | null> {
    return this.repo.findOne({ where: { code, isActive: true } });
  }

  async findByEntityType(entityType: EntityTypeEnum): Promise<DocumentType[]> {
    return this.repo.find({
      where: { entityType, isActive: true },
      order: { name: "ASC" },
    });
  }

  create(data: Partial<DocumentType>): DocumentType {
    return this.repo.create(data);
  }

  async save(entity: DocumentType): Promise<DocumentType> {
    return this.repo.save(entity);
  }
}
