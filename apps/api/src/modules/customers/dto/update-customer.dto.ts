import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto.js';

/**
 * Tüm alanlar opsiyonel — sadece gönderilenler güncellenir.
 * code değiştirilemez (benzersizlik için).
 */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
