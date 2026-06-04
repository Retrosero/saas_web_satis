import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@saas/shared';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // Eğer zaten ApiResponse formatındaysa (data + meta) veya null ise dokunma
        if (data === null || data === undefined) {
          return data as T;
        }
        if (typeof data === 'object' && 'data' in (data as object) && 'meta' in (data as object)) {
          return data as T;
        }
        return {
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        } as ApiResponse<T>;
      }),
    );
  }
}
