import { Queue, Worker } from 'bullmq';

const shipmentQueue = new Queue('shipmentQueue');
await shipmentQueue.obliterate({ force: true });

const worker = new Worker(
  'shipmentQueue',
  async job => {
    const shipmentId = job.data.id;

    // Log the start of processing
    console.log(`Processing shipment ID: ${shipmentId}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

    // Log completion
    console.log(`Shipment ID: ${shipmentId} processed`);
  },
  {
    connection: { url: 'redis://localhost:6379' },
    concurrency: 2,
  },
);

worker.on('ready', () => {
  console.log('worker ready');
});
worker.on('active', job => {
  console.log('job active');
});

worker.on('completed', job => {
  console.log(`Job with ID ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job with ID ${job?.id} failed with error: ${err.message}`);
});

const addShipmentToQueue = async shipment => {
  const jobId = 's' + shipment.id;
  const jobs = await shipmentQueue.getJobs();
  const activeJob = jobs.find(job => job.id === jobId);

  let delay = 0;

  if (activeJob) {
    delay = 5_000;
    console.log(`Delay queue, because of `, activeJob.id, activeJob.data);
  }

  await shipmentQueue.add(
    shipment.name,
    { id: shipment.id, name: shipment.name },
    { jobId, delay, removeOnComplete: true },
  );
};

// джоба с одинаковым id будет пропущена
await addShipmentToQueue({ id: '1', name: 'Shipment A' });
await addShipmentToQueue({ id: '1', name: 'Shipment A Duplicate' }); // Same ID as Shipment A
await addShipmentToQueue({ id: '2', name: 'Shipment B' });
await addShipmentToQueue({ id: '2', name: 'Shipment B Duplicate' }); // Same ID as Shipment B
await addShipmentToQueue({ id: '3', name: 'Shipment C' });

console.log('Shipments added to the queue.');

// Отложенный вызов не сработал дубликаты пропускаются
