import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CommandPaletteService } from './command-palette.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('command-palette')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('command-palette')
export class CommandPaletteController {
  constructor(private readonly svc: CommandPaletteService) {}
  @Get('commands')
  list(@Query('category') category?: string, @Query('search') search?: string) { return this.svc.list({ category, search }); }
}
