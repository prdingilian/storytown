import { createClient } from 'redis'

const redisClient = createClient()
const subClient = createClient()
redisClient.on('error', err => console.log('Redis Client Error', err));
subClient.on('error', err => console.log('Redis Client Error', err));

(async function connect() {
  await redisClient.connect()
  await subClient.connect()
})()

export { redisClient, subClient }
