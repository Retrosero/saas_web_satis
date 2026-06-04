import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/** URL'den / header'dan / token'dan gelen tenant id'yi al. */
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx
    .switchToHttp()
    .getRequest<{ params: Record<string, string>; headers: Record<string, string>; user?: { tid?: string } }>();
  const fromParam = request.params['tenantId'];
  const fromHeader = request.headers['x-tenant-id'];
  const fromJwt = request.user?.tid;
  const tenantId = fromParam ?? fromHeader ?? fromJwt;
  if (!tenantId || tenantId === 'SYSTEM') {
    throw new BadRequestException('Tenant kimliği bulunamadı');
  }
  return tenantId;
});
