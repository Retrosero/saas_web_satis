import { Module, Global } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController, SearchAdminController } from './search.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SearchController, SearchAdminController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
