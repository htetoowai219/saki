import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LinksService } from './links.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { ListLinksQueryDto } from './dto/list-links-query.dto.js';
import { UpdateLinkDto } from './dto/update-link.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';

@ApiTags('Links')
@ApiBearerAuth()
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new short link' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLinkDto) {
    return this.linksService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List short links with pagination and search' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLinksQueryDto,
  ) {
    return this.linksService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single short link by ID' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.linksService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update destination URL, status, or expiration' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a short link' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.linksService.remove(user.id, id);
  }
}
