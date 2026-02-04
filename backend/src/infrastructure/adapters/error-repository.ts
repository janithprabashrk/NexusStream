import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ErrorEvent, PartnerId, ErrorCode } from '../../domain/models';
import {
  IErrorRepositoryPort,
  ErrorQueryFilters,
  ErrorPaginationOptions,
  ErrorPaginatedResult,
  ErrorStatistics,
} from '../../domain/ports/error-repository.port';

/**
 * File-based implementation of error repository.
 * Persists error events to a JSON file.
 * 
 * SPEC REFERENCE: Optional - "Errors View" support
 */
export class FileErrorRepository implements IErrorRepositoryPort {
  private errors: Map<string, ErrorEvent> = new Map();
  private readonly filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs = 500;

  constructor(dataDir: string = './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'errors.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const errors: ErrorEvent[] = JSON.parse(data);
        for (const error of errors) {
          this.errors.set(error.id, error);
        }
        console.log(`📂 Loaded ${errors.length} errors from ${this.filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading errors from file:`, error);
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveToFile(), this.debounceMs);
  }

  private saveToFile(): void {
    try {
      const errors = Array.from(this.errors.values());
      fs.writeFileSync(this.filePath, JSON.stringify(errors, null, 2), 'utf-8');
    } catch (error) {
      console.error(`❌ Error saving errors to file:`, error);
    }
  }

  async save(error: ErrorEvent): Promise<void> {
    // Ensure the error has an ID
    if (!error.id) {
      error.id = uuidv4();
    }
    this.errors.set(error.id, error);
    this.scheduleSave();
  }

  async findById(id: string): Promise<ErrorEvent | null> {
    return this.errors.get(id) ?? null;
  }

  async findMany(
    filters?: ErrorQueryFilters,
    pagination?: ErrorPaginationOptions
  ): Promise<ErrorPaginatedResult<ErrorEvent>> {
    let results = Array.from(this.errors.values());

    // Apply filters
    if (filters) {
      if (filters.partnerId) {
        results = results.filter((e) => e.partnerId === filters.partnerId);
      }
      if (filters.errorCode) {
        results = results.filter((e) => e.errorCode === filters.errorCode);
      }
      if (filters.fromDate) {
        results = results.filter((e) => new Date(e.timestamp) >= filters.fromDate!);
      }
      if (filters.toDate) {
        results = results.filter((e) => new Date(e.timestamp) <= filters.toDate!);
      }
    }

    // Sort by timestamp descending (most recent first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const total = results.length;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = results.slice(startIndex, startIndex + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  async getStatistics(): Promise<ErrorStatistics> {
    const errors = Array.from(this.errors.values());
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsByPartner: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    let last24Hours = 0;

    for (const error of errors) {
      // Count by partner
      errorsByPartner[error.partnerId] = (errorsByPartner[error.partnerId] || 0) + 1;

      // Count by error code
      errorsByCode[error.errorCode] = (errorsByCode[error.errorCode] || 0) + 1;

      // Count last 24 hours
      if (new Date(error.timestamp) >= yesterday) {
        last24Hours++;
      }
    }

    return {
      totalErrors: errors.length,
      errorsByPartner,
      errorsByCode,
      last24Hours,
    };
  }

  async count(filters?: ErrorQueryFilters): Promise<number> {
    const result = await this.findMany(filters);
    return result.total;
  }

  async clear(): Promise<void> {
    this.errors.clear();
    this.scheduleSave();
  }
}

/**
 * In-memory implementation for testing
 */
export class InMemoryErrorRepository implements IErrorRepositoryPort {
  private errors: Map<string, ErrorEvent> = new Map();

  async save(error: ErrorEvent): Promise<void> {
    if (!error.id) {
      error.id = uuidv4();
    }
    this.errors.set(error.id, error);
  }

  async findById(id: string): Promise<ErrorEvent | null> {
    return this.errors.get(id) ?? null;
  }

  async findMany(
    filters?: ErrorQueryFilters,
    pagination?: ErrorPaginationOptions
  ): Promise<ErrorPaginatedResult<ErrorEvent>> {
    let results = Array.from(this.errors.values());

    if (filters?.partnerId) {
      results = results.filter((e) => e.partnerId === filters.partnerId);
    }
    if (filters?.errorCode) {
      results = results.filter((e) => e.errorCode === filters.errorCode);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = results.length;
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const data = results.slice(startIndex, startIndex + pageSize);

    return { data, total, page, pageSize, totalPages, hasMore: page < totalPages };
  }

  async getStatistics(): Promise<ErrorStatistics> {
    const errors = Array.from(this.errors.values());
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const errorsByPartner: Record<string, number> = {};
    const errorsByCode: Record<string, number> = {};
    let last24Hours = 0;

    for (const error of errors) {
      errorsByPartner[error.partnerId] = (errorsByPartner[error.partnerId] || 0) + 1;
      errorsByCode[error.errorCode] = (errorsByCode[error.errorCode] || 0) + 1;
      if (new Date(error.timestamp) >= yesterday) {
        last24Hours++;
      }
    }

    return { totalErrors: errors.length, errorsByPartner, errorsByCode, last24Hours };
  }

  async count(): Promise<number> {
    return this.errors.size;
  }

  async clear(): Promise<void> {
    this.errors.clear();
  }
}
