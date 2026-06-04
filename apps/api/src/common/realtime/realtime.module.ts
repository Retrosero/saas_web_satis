import { Module, Global } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { RealtimeAdminController } from './realtime.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [PrismaModule, JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev-secret', signOptions: { expiresIn: '1d' } })],
  providers: [RealtimeGateway, RealtimeService],
  controllers: [RealtimeAdminController],
  exports: [RealtimeService, RealtimeGateway],
})
export class RealtimeModule {}
