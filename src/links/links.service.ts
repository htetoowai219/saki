import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.validation.js';
import { Link, Prisma } from '../generated/prisma/client.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { nanoid } from 'nanoid';
import { ListLinksQueryDto } from './dto/list-links-query.dto.js';
import { UpdateLinkDto } from './dto/update-link.dto.js';

@Injectable()
export class LinksService {
  private readonly baseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService<Env, true>,
  ) {
    this.baseUrl = configService
      .get('BASE_URL', { infer: true })
      .replace(/\/$/, '');
  }

  private formatLink(link: Link) {
    return {
      ...link,
      shortUrl: `${this.baseUrl}/r/${link.shortCode}`,
    };
  }

  async create(userId: string, dto: CreateLinkDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const shortCode = dto.customAlias ?? nanoid(7);

    if (dto.customAlias) {
      const existing = await this.prisma.link.findUnique({
        where: { shortCode },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(`Alias "${shortCode}" is already taken`);
      }
    }

    const link = await this.prisma.link.create({
      data: {
        shortCode,
        originalUrl: dto.originalUrl,
        expiresAt,
        userId,
      },
    });

    return this.formatLink(link);
  }

  async findAll(userId: string, query: ListLinksQueryDto) {
    const { page, limit, search } = query;

    const where: Prisma.LinkWhereInput = {
      userId,
      ...(search
        ? {
            OR: [
              { shortCode: { contains: search, mode: 'insensitive' } },
              { originalUrl: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      data: items.map((link) => this.formatLink(link)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const link = await this.prisma.link.findFirst({
      where: { id, userId },
    });

    if (!link) {
      throw new NotFoundException(`Link with id "${id}" not found`);
    }

    return this.formatLink(link);
  }

  async update(userId: string, id: string, dto: UpdateLinkDto) {
    // Ensure the row exists first so missing IDs return 404 instead of Prisma P2025
    await this.findOne(userId, id);

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    const updated = await this.prisma.link.update({
      where: { id },
      data: {
        originalUrl: dto.originalUrl,
        isActive: dto.isActive,
        expiresAt,
      },
    });

    return this.formatLink(updated);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.link.delete({ where: { id } });
  }

  async resolveShortCode(code: string): Promise<string> {
    const link = await this.prisma.link.findUnique({
      where: { shortCode: code },
    });

    if (!link) {
      throw new NotFoundException(`Short link "${code}" not found`);
    }

    const isExpired = link.expiresAt !== null && link.expiresAt <= new Date();
    if (!link.isActive || isExpired) {
      throw new GoneException('This short link is inactive or has expired');
    }

    return link.originalUrl;
  }
}
