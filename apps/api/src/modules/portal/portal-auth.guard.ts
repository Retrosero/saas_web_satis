import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PortalJwtPayload } from './portal.service.js';

@Injectable()
export class PortalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Token gerekli');
    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<PortalJwtPayload>(token);
      if (payload.type !== 'customer-portal') throw new UnauthorizedException('Geçersiz token tipi');
      req.portal = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }
  }
}
