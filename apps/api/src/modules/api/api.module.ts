import { Module } from '@nestjs/common';
import { ApiController } from './api.controller.js';
import { ApiService } from './api.service.js';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
  exports: [ApiService],
})
export class ApiModule {}
