import { Module } from '@nestjs/common';
import { ProductRecommendationsController } from './product-recommendations.controller';
import { ProductRecommendationsService } from './product-recommendations.service';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({ imports: [PrismaModule], controllers: [ProductRecommendationsController], providers: [ProductRecommendationsService], exports: [ProductRecommendationsService] })
export class ProductRecommendationsModule {}
