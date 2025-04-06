import { Worker, Job, Queue } from 'bullmq';
import { setTimeout } from 'node:timers/promises';

const queue1 = new Queue('order1');
const queue2 = new Queue('order2');

await queue1.obliterate({ force: true });
await queue2.obliterate({ force: true });

async function queueAdd(id, data) {
  const remainder = id % 2;

  if (remainder === 0) await queue1.add(`order ${id}`, data);
  if (remainder === 1) await queue2.add(`order ${id}`, data);
}

await queueAdd(1, 'Task 1 A');
await queueAdd(1, 'Task 1 B');
await queueAdd(2, 'Task 2 C');
await queueAdd(3, 'Task 3 D');
await queueAdd(2, 'Task 2 E');
await queueAdd(3, 'Task 3 F');

createWorker(1);
createWorker(2);

function createWorker(n: number) {
  let queueName: string = '';
  const remainder = n % 2;

  if (remainder === 0) queueName = 'order1';
  if (remainder === 1) queueName = 'order2';

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      console.log(`< started process for job ${job.data} in worker ${n}`);
      await setTimeout(8000); // Emulate long processing
      // console.log(`> ended process for job ${job.data} in worker ${n}`);
    },
    {
      connection: { url: 'redis://localhost:6379' },
      concurrency: 1,
    },
  );

  // worker.on('ready', () => {
  //   console.log(`worker ${n} ready`);
  // });
  // worker.on('active', job => {
  //   console.log(`job ${job.data}  active in worker ${n}`);
  // });
  // worker.on('completed', job => {
  //   console.log(`job with id ${job.data} has been completed`);
  // });
  worker.on('drained', () => {
    console.log(`worker ${n} drained`);
  });
}

/* SOLVED
< started process for job Task 1 A in worker 1
< started process for job Task 2 C in worker 2
< started process for job Task 1 B in worker 1
< started process for job Task 2 E in worker 2
< started process for job Task 3 D in worker 1
worker 2 drained
< started process for job Task 3 F in worker 1
worker 1 drained
 */
