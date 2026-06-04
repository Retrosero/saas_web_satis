import { Module } from '@nestjs/common';
import { NotificationsExtendedController } from './notifications-extended.controller';
import { NotificationsExtendedService } from './notifications-extended.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsExtendedController],
  providers: [NotificationsExtendedService],
  exports: [NotificationsExtendedService],
})
export class NotificationsExtendedModule {}
