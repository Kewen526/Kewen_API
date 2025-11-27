import cron from 'node-cron';
import prisma from '../config/database';
import { ConnectionManager, DatabaseType } from './database/ConnectorFactory';
import { decrypt } from '../utils/crypto';
import logger from '../utils/logger';

interface ScheduledTask {
  id: string;
  jobId: string;
  task: cron.ScheduledTask;
}

export class SchedulerService {
  private static tasks: Map<string, ScheduledTask> = new Map();

  static async initialize(): Promise<void> {
    logger.info('Initializing scheduler service');

    const jobs = await prisma.scheduledJob.findMany({
      where: { enabled: true },
    });

    for (const job of jobs) {
      await this.scheduleJob(job.id);
    }

    logger.info(`Scheduled ${jobs.length} jobs`);
  }

  static async scheduleJob(jobId: string): Promise<void> {
    try {
      const job = await prisma.scheduledJob.findUnique({
        where: { id: jobId },
      });

      if (!job || !job.enabled) {
        return;
      }

      if (this.tasks.has(jobId)) {
        this.unscheduleJob(jobId);
      }

      const task = cron.schedule(job.cronExpression, async () => {
        await this.executeJob(jobId);
      });

      this.tasks.set(jobId, {
        id: jobId,
        jobId,
        task,
      });

      const nextRun = this.getNextRunTime(job.cronExpression);
      await prisma.scheduledJob.update({
        where: { id: jobId },
        data: { nextRunAt: nextRun },
      });

      logger.info(`Job scheduled: ${job.name} (${job.cronExpression})`);
    } catch (error) {
      logger.error('Job scheduling error:', error);
    }
  }

  static unscheduleJob(jobId: string): void {
    const scheduledTask = this.tasks.get(jobId);
    if (scheduledTask) {
      scheduledTask.task.stop();
      this.tasks.delete(jobId);
      logger.info(`Job unscheduled: ${jobId}`);
    }
  }

  private static async executeJob(jobId: string): Promise<void> {
    const startTime = new Date();
    let execution: any;

    try {
      const job = await prisma.scheduledJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      execution = await prisma.jobExecution.create({
        data: {
          jobId,
          status: 'SUCCESS',
          startTime,
        },
      });

      const dataSource = await prisma.dataSource.findUnique({
        where: { id: job.dataSourceId },
      });

      if (!dataSource) {
        throw new Error('Data source not found');
      }

      const connector = await ConnectionManager.getConnection(
        dataSource.id,
        dataSource.type as DatabaseType,
        {
          host: dataSource.host,
          port: dataSource.port,
          database: dataSource.database,
          username: dataSource.username,
          password: decrypt(dataSource.password),
          ssl: dataSource.ssl,
          sslConfig: dataSource.sslConfig,
          options: dataSource.options,
        }
      );

      const result = await connector.execute(job.sql);

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: 'SUCCESS',
          endTime,
          executionTime,
          rowsAffected: result.affectedRows || result.rowCount,
        },
      });

      await prisma.scheduledJob.update({
        where: { id: jobId },
        data: {
          lastRunAt: startTime,
          nextRunAt: this.getNextRunTime(job.cronExpression),
        },
      });

      logger.info(`Job executed successfully: ${job.name}`);
    } catch (error: any) {
      logger.error('Job execution error:', error);

      if (execution) {
        await prisma.jobExecution.update({
          where: { id: execution.id },
          data: {
            status: 'FAILED',
            endTime: new Date(),
            errorMessage: error.message,
          },
        });
      }
    }
  }

  private static getNextRunTime(cronExpression: string): Date {
    const interval = cron.validate(cronExpression) ? cron.schedule(cronExpression, () => {}) : null;
    if (!interval) {
      return new Date(Date.now() + 60000);
    }
    interval.stop();
    return new Date(Date.now() + 60000);
  }

  static shutdown(): void {
    logger.info('Shutting down scheduler service');
    this.tasks.forEach((task) => task.task.stop());
    this.tasks.clear();
  }
}
