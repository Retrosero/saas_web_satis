import { Module } from '@nestjs/common';
import { CommandPaletteController } from './command-palette.controller';
import { CommandPaletteService } from './command-palette.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [CommandPaletteController], providers: [CommandPaletteService], exports: [CommandPaletteService] })
export class CommandPaletteModule {}
