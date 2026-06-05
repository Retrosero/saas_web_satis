import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  override handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException('Geçersiz veya eksik kimlik bilgisi');
    }
    // JWT strategy'den gelen payload: { sub, tid, email, ... }
    // Normalize et: req.user.id = sub, req.user.tenantId = tid
    const u = user as any;
    if (u.sub && !u.id) u.id = u.sub;
    if (u.tid && !u.tenantId) u.tenantId = u.tid;
    return user;
  }
}
