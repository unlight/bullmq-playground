import { Worker, Job, Queue } from 'bullmq';
import { setTimeout } from 'node:timers/promises';

const queueName = 'cars';
const queue = new Queue(queueName);

await queue.obliterate({ force: true });

await queue.add('car 1', 'job data A');
await queue.add('car 1', 'job data B');
await queue.add('car 2', 'job data C');
await queue.add('car 3', 'job data D');

queue.on('waiting', (job: Job) => {
  console.log(`waiting job ${job.id} ${job.name}`);
});

createWorker(1);
createWorker(2);

function createWorker(n: number) {
  const worker = new Worker(
    queueName,
    async (job: Job) => {
      console.log(
        `< started process for job ${job.id} ${job.data} in worker ${n}`,
      );
      await setTimeout(2000); // Emulate long processing
      console.log(
        `> ended process for job ${job.id} ${job.data} in worker ${n}`,
      );
    },
    {
      connection: { url: 'redis://localhost:6379' },
      concurrency: 1,
    },
  );

  worker.on('ready', () => {
    console.log(`worker ${n} ready`);
  });
  worker.on('active', job => {
    console.log(`job ${job.id} ${job.data}  active in worker ${n}`);
  });
  worker.on('completed', job => {
    console.log(`job with id ${job.id} ${job.data} has been completed`);
  });
  worker.on('drained', () => {
    console.log(`worker ${n} drained`);
  });
}
