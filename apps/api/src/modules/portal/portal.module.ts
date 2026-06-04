import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PortalController } from './portal.controller.js';
import { PortalService } from './portal.service.js';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret', signOptions: { expiresIn: '7d' } })],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
