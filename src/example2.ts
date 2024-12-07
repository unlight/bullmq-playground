import { Worker, Job, Queue } from 'bullmq';
import { setTimeout } from 'node:timers/promises';

const queueName = 'cars';
const queue = new Queue(queueName);

const worker = new Worker(
  queueName,
  async (job: Job) => {
    await job.updateProgress(1);
    console.log('started process for job', job.id, job.name);
    await setTimeout(2000);
    console.log('ended process for job', job.id, job.name);
  },
  {
    autorun: false,
    connection: { url: 'redis://localhost:6379' },
    concurrency: 2,
  },
);

worker.on('ready', () => {
  console.log('worker ready');
});
worker.on('active', job => {
  console.log('job active', job.id, job.name);
});
worker.on('completed', job => {
  console.log(`job with id ${job.id} ${job.name} has been completed`);
});
worker.on('drained', () => {
  console.log('worker drained'); // опустошён
});

queue.on('cleaned', (...args) => console.log('cleaned', ...args));
queue.on('error', (...args) => console.log('error', ...args));
queue.on('paused', (...args) => console.log('paused', ...args));
queue.on('progress', (...args) => console.log('progress', ...args));
queue.on('removed', (...args) => console.log('removed', ...args));
queue.on('resumed', (...args) => console.log('resumed', ...args));
queue.on('waiting', job => console.log('queue waiting job id', job.id));

await queue.add('shipment 1', { name: 'shipment 1' });
await queue.add('shipment 1', { name: 'shipment 1' });
await queue.addBulk([
  { name: 'shipment 1', data: { name: 'shipment 1' } },
  { name: 'shipment 2', data: { name: 'shipment 2' } },
  { name: 'shipment 3', data: { name: 'shipment 3' } },
]);

await worker.run();
