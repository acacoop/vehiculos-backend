import {
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
  IsNull,
} from "typeorm";
import { Document } from "@/entities/Document";
import { EntityTypeEnum, DocumentTypeEnum } from "@/enums";
import {
  IDocumentRepository,
  DocumentFilters,
} from "@/repositories/interfaces/IDocumentRepository";
import {
  RepositoryFindOptions,
  resolvePagination,
} from "@/repositories/interfaces/common";
import { applyFilters } from "@/utils/index";

export class DocumentRepository implements IDocumentRepository {
  private readonly repo: Repository<Document>;

  constructor(ds: DataSource) {
    this.repo = ds.getRepository(Document);
  }

  async findAndCount(
    options?: RepositoryFindOptions<DocumentFilters>,
  ): Promise<[Document[], number]> {
    const { filters, pagination } = options || {};

    const qb = this.repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.documentType", "dt")
      .leftJoinAndSelect("d.uploadedBy", "u")
      .leftJoinAndSelect("d.replacedBy", "rb")
      .orderBy("d.uploadedAt", "DESC");

    // Apply filters
    applyFilters(qb, filters, {
      entityType: { field: "d.entityType" },
      entityId: { field: "d.entityId" },
      documentTypeId: { field: "dt.id" },
      isCurrentVersion: { field: "d.isCurrentVersion" },
      isActive: { field: "d.isActive" },
      uploadedById: { field: "u.id" },
    });

    // Pagination
    const { limit, offset } = resolvePagination(pagination);
    qb.take(limit);
    qb.skip(offset);

    return qb.getManyAndCount();
  }

  async findOne(id: string): Promise<Document | null> {
    return this.repo.findOne({
      where: { id },
      relations: ["documentType", "uploadedBy", "replacedBy"],
    });
  }

  create(data: Partial<Document>): Document {
    return this.repo.create(data);
  }

  async save(entity: Document): Promise<Document> {
    return this.repo.save(entity);
  }

  async findCurrentByEntity(
    entityType: EntityTypeEnum,
    entityId: string,
  ): Promise<Document[]> {
    return this.repo.find({
      where: {
        entityType,
        entityId,
        isCurrentVersion: true,
        isActive: true,
      },
      relations: ["documentType", "uploadedBy"],
      order: { uploadedAt: "DESC" },
    });
  }

  async findCurrentByEntityAndType(
    entityType: EntityTypeEnum,
    entityId: string,
    documentTypeCode: DocumentTypeEnum,
  ): Promise<Document | null> {
    return this.repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.documentType", "dt")
      .leftJoinAndSelect("d.uploadedBy", "u")
      .where("d.entityType = :entityType", { entityType })
      .andWhere("d.entityId = :entityId", { entityId })
      .andWhere("dt.code = :documentTypeCode", { documentTypeCode })
      .andWhere("d.isCurrentVersion = 1")
      .andWhere("d.isActive = 1")
      .getOne();
  }

  async findHistoricalVersions(
    entityType: EntityTypeEnum,
    entityId: string,
    documentTypeCode: DocumentTypeEnum,
  ): Promise<Document[]> {
    return this.repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.documentType", "dt")
      .leftJoinAndSelect("d.uploadedBy", "u")
      .leftJoinAndSelect("d.replacedBy", "rb")
      .where("d.entityType = :entityType", { entityType })
      .andWhere("d.entityId = :entityId", { entityId })
      .andWhere("dt.code = :documentTypeCode", { documentTypeCode })
      .andWhere("d.isActive = 1")
      .orderBy("d.uploadedAt", "DESC")
      .getMany();
  }

  async findExpiringDocuments(daysAhead: number): Promise<Document[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Format dates as YYYY-MM-DD for SQL date comparison
    const todayStr = today.toISOString().split("T")[0];
    const futureDateStr = futureDate.toISOString().split("T")[0];

    return this.repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.documentType", "dt")
      .leftJoinAndSelect("d.uploadedBy", "u")
      .where("d.isCurrentVersion = 1")
      .andWhere("d.isActive = 1")
      .andWhere("d.expirationDate IS NOT NULL")
      .andWhere("d.expirationDate >= :today", { today: todayStr })
      .andWhere("d.expirationDate <= :futureDate", {
        futureDate: futureDateStr,
      })
      .orderBy("d.expirationDate", "ASC")
      .getMany();
  }

  async findExpiredDocuments(): Promise<Document[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    return this.repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.documentType", "dt")
      .leftJoinAndSelect("d.uploadedBy", "u")
      .where("d.isCurrentVersion = 1")
      .andWhere("d.isActive = 1")
      .andWhere("d.expirationDate IS NOT NULL")
      .andWhere("d.expirationDate < :today", { today: todayStr })
      .orderBy("d.expirationDate", "DESC")
      .getMany();
  }
}
