import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { QUEUE_MAIL, QUEUE_REPORT, QUEUE_BULK, BaseJobData } from './queue.module';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_MAIL) private readonly mailQ: Queue,
    @InjectQueue(QUEUE_REPORT) private readonly reportQ: Queue,
    @InjectQueue(QUEUE_BULK) private readonly bulkQ: Queue,
  ) {}

  // === MAIL ===
  async enqueueMail(payload: { to: string; subject: string; html: string; templateKey?: string; data?: Record<string, any> } & BaseJobData) {
    const job = await this.mailQ.add('send', payload, { priority: 2 });
    return { jobId: job.id, queue: QUEUE_MAIL };
  }

  // === REPORT ===
  async enqueueReport(payload: { reportKey: string; params?: Record<string, any>; output?: 'csv' | 'pdf' | 'json' } & BaseJobData) {
    const job = await this.reportQ.add('generate', payload, { priority: 3 });
    return { jobId: job.id, queue: QUEUE_REPORT };
  }

  // === BULK ===
  async enqueueBulk(payload: { op: 'PRICE_UPDATE' | 'CATEGORY_CHANGE' | 'BRAND_ASSIGN' | 'PRODUCT_DEACTIVATE' | 'CUSTOMER_DEACTIVATE' | 'TAG_ASSIGN'; filters: any; update: any; batchSize?: number } & BaseJobData) {
    const job = await this.bulkQ.add('process', payload, { priority: 5, attempts: 1 });
    return { jobId: job.id, queue: QUEUE_BULK };
  }

  // === DASHBOARD ===
  async getAllQueues() {
    const queues = [
      { name: QUEUE_MAIL, queue: this.mailQ },
      { name: QUEUE_REPORT, queue: this.reportQ },
      { name: QUEUE_BULK, queue: this.bulkQ },
    ];
    const result: any[] = [];
    for (const { name, queue } of queues) {
      try {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
        const isPaused = await queue.isPaused();
        result.push({ name, ...counts, paused: isPaused });
      } catch (e: any) {
        result.push({ name, error: e.message });
      }
    }
    return result;
  }

  async getJobs(queueName: string, status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed', start = 0, end = 20) {
    const q = queueName === QUEUE_MAIL ? this.mailQ : queueName === QUEUE_REPORT ? this.reportQ : this.bulkQ;
    return q.getJobs(status, start, end);
  }

  async retryJob(queueName: string, jobId: string) {
    const q = queueName === QUEUE_MAIL ? this.mailQ : queueName === QUEUE_REPORT ? this.reportQ : this.bulkQ;
    const job = await q.getJob(jobId);
    if (!job) return { ok: false, reason: 'not found' };
    await job.retry();
    return { ok: true };
  }

  async removeJob(queueName: string, jobId: string) {
    const q = queueName === QUEUE_MAIL ? this.mailQ : queueName === QUEUE_REPORT ? this.reportQ : this.bulkQ;
    const job = await q.getJob(jobId);
    if (!job) return { ok: false, reason: 'not found' };
    await job.remove();
    return { ok: true };
  }
}
