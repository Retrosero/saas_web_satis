import { Module } from '@nestjs/common';
import { WhiteLabelController } from './white-label.controller.js';
import { WhiteLabelService } from './white-label.service.js';

@Module({
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
