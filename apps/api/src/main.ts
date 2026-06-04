import 'reflect-metadata';
import './instrument';
import { initObservability } from './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

initObservability();
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // Logger
  app.useLogger(app.get(PinoLogger));

  // Güvenlik
  app.use(helmet());

  // CORS
  const origins = (config.get<string>('API_CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  // Global prefix
  const apiPrefix = config.get<string>('API_PREFIX') ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Validation pipe (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filter & interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS API')
    .setDescription('SaaS İşletme Yönetim Platformu — REST API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('auth', 'Kimlik doğrulama ve oturum yönetimi')
    .addTag('super-admin', 'Süper admin paneli (firma dışı)')
    .addTag('tenants', 'Firma yönetimi')
    .addTag('users', 'Kullanıcı yönetimi')
    .addTag('health', 'Sağlık kontrolü')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Port
  const port = config.get<number>('API_PORT') ?? 3000;
  await app.listen(port);

  const logger = app.get(PinoLogger);
  logger.log(`🚀 API çalışıyor: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger: http://localhost:${port}/${apiPrefix}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap hatası:', err);
  process.exit(1);
});
