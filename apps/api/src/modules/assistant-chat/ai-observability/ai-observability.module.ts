import { Module, Global } from '@nestjs/common';
import { AIObservabilityController } from './ai-observability.controller';
import { AIObservabilityService } from './ai-observability.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AIObservabilityController],
  providers: [AIObservabilityService],
  exports: [AIObservabilityService],
})
export class AIObservabilityModule {}
