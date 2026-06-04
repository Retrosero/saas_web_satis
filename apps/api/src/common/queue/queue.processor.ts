import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { QUEUE_MAIL, QUEUE_REPORT, QUEUE_BULK } from './queue.module';

@Processor(QUEUE_MAIL, { concurrency: 5 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  async process(job: Job): Promise<any> {
    const { to, subject } = job.data;
    this.logger.log(`Mail gönderildi: ${to} - ${subject} (${job.id})`);
    // Simülasyon: gerçek SMTP eklenirse burada
    await new Promise((r) => setTimeout(r, 100));
    return { sentAt: new Date().toISOString(), to, subject };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Mail FAILED: ${job.id} - ${err.message}`);
  }
}

@Processor(QUEUE_REPORT, { concurrency: 2 })
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  async process(job: Job): Promise<any> {
    const { reportKey, params } = job.data;
    this.logger.log(`Rapor üretildi: ${reportKey} (${job.id})`);
    await new Promise((r) => setTimeout(r, 2000));
    return { reportKey, generatedAt: new Date().toISOString(), params, size: 1024 };
  }
}

@Processor(QUEUE_BULK, { concurrency: 1 })
export class BulkProcessor extends WorkerHost {
  private readonly logger = new Logger(BulkProcessor.name);

  async process(job: Job): Promise<any> {
    const { op, filters, batchSize = 100 } = job.data;
    this.logger.log(`Bulk işlemi başladı: ${op} (${job.id})`);
    // Simülasyon: 5 batch'te işlendi
    for (let i = 1; i <= 5; i++) {
      await job.updateProgress((i / 5) * 100);
      await new Promise((r) => setTimeout(r, 1000));
    }
    return { op, completedAt: new Date().toISOString(), processedBatches: 5 };
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number | object) {
    this.logger.debug(`Bulk progress: ${job.id} - ${typeof progress === 'number' ? progress + '%' : JSON.stringify(progress)}`);
  }
}
