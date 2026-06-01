import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
