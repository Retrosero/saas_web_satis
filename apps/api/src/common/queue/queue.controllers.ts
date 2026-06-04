import { Controller, Get, Post, Delete, Param, Query, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { QueueService } from './queue.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('queue-admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('queue-admin')
export class QueueAdminController {
  constructor(private readonly svc: QueueService) {}

  @Get('queues')
  list() { return this.svc.getAllQueues(); }

  @Get('queues/:name/jobs')
  jobs(@Param('name') name: string, @Query('status') status: any = 'waiting', @Query('start') start = '0', @Query('end') end = '20') {
    return this.svc.getJobs(name, status, Number(start), Number(end));
  }

  @Post('queues/:name/jobs/:jobId/retry')
  retry(@Param('name') name: string, @Param('jobId') jobId: string) { return this.svc.retryJob(name, jobId); }

  @Delete('queues/:name/jobs/:jobId')
  remove(@Param('name') name: string, @Param('jobId') jobId: string) { return this.svc.removeJob(name, jobId); }

  @Post('mail/enqueue')
  enqueueMail(@Body() body: any) { return this.svc.enqueueMail(body); }
  @Post('report/enqueue')
  enqueueReport(@Body() body: any) { return this.svc.enqueueReport(body); }
  @Post('bulk/enqueue')
  enqueueBulk(@Body() body: any) { return this.svc.enqueueBulk(body); }
}
