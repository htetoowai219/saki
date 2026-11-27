import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LinksService } from './links.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('Redirect')
@Controller('r')
export class RedirectController {
  constructor(private readonly linksService: LinksService) {}

  @Public()
  @Get(':code')
  @Redirect()
  @ApiOperation({ summary: 'Redirect visitor to the original URL (302 Found)' })
  async redirect(@Param('code') code: string) {
    const originalUrl = await this.linksService.resolveShortCode(code);

    return {
      url: originalUrl,
      statusCode: 302,
    };
  }
}
