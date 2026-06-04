import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Sentry } from '../../instrument';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('saas-api');

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const span = tracer.startSpan(`${req.method} ${req.route?.path ?? req.url}`, {
      attributes: { tenantId: req.user?.tenantId, userId: req.user?.id, url: req.url, method: req.method },
    });
    return next.handle().pipe(
      tap(() => { span.setStatus({ code: SpanStatusCode.OK }); span.end(); }),
      catchError((err) => {
        span.recordException(err); span.setStatus({ code: SpanStatusCode.ERROR, message: err.message }); span.end();
        if (this.shouldReport(err)) { Sentry.captureException(err, { extra: { url: req.url, userId: req.user?.id, tenantId: req.user?.tenantId } }); }
        return throwError(() => err);
      }),
    );
  }

  private shouldReport(err: any): boolean {
    if (err instanceof HttpException) {
      const status = err.getStatus();
      return status >= 500; // Sadece 5xx
    }
    return true;
  }
}
