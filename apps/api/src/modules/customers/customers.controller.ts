import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { FilterCustomerDto } from './dto/filter-customer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '@saas/shared';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  /**
   * Filtreli, sayfalı cari listesi.
   * Her satırda anlık bakiye ve hareket sayısı döner.
   */
  @Get()
  @ApiOperation({ summary: 'Cari listesi (müşteri + tedarikçi)' })
  @ApiQuery({ name: 'type', required: false, description: 'CUSTOMER | SUPPLIER | BOTH' })
  list(@CurrentUser() user: JwtPayload, @Query() filter: FilterCustomerDto) {
    return this.customers.list(user.tid, filter);
  }

  /**
   * Tek cari detayı.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Cari detayı (anlık bakiye dahil)' })
  findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customers.findById(user.tid, id);
  }

  /**
   * Cari ekstresi — hareket listesi + dönem toplamları + bakiye.
   */
  @Get(':id/statement')
  @ApiOperation({ summary: 'Cari ekstresi (hareketler + bakiye)' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO tarih (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'refType', required: false, description: 'SALE | COLLECTION | ...' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  statement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('refType') refType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.customers.getStatement(user.tid, id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      refType,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  /**
   * Yeni cari oluştur.
   * Açılış bakiyesi varsa otomatik OPENING_BALANCE hareketi oluşturulur.
   */
  @Post()
  @ApiOperation({ summary: 'Yeni cari oluştur' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customers.create(user.tid, dto, user.sub);
  }

  /**
   * Cari güncelle. code değiştirilemez.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cari güncelle' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const { code: _code, openingBalance: _ob, ...rest } = dto;
    return this.customers.update(user.tid, id, rest, user.sub);
  }

  /**
   * Pasife al — hareketi olan cariler için güvenli yol.
   * Hareketi olmayan carilerde remove() (soft delete) kullanılabilir.
   */
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Cariyi pasife al' })
  deactivate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customers.deactivate(user.tid, id, user.sub);
  }

  /**
   * Soft delete — sadece hareketi OLMAYAN cariler silinebilir.
   * Hareketi varsa deactivate kullanın.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cari sil (soft, sadece hareketi yoksa)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customers.remove(user.tid, id, user.sub);
  }
}
