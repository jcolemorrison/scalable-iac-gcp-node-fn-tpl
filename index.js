const functions = require('@google-cloud/functions-framework');
const redis = require('redis');

const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}`,
  disableClientInfo: true
})

client.on('error', err => console.error('ERR:REDIS:', err));
client.connect();

functions.http('main', async (req, res) => {
  try {
    const keys = ["roomcount", "c:game_room"];
    const keyValuePairs = {};

    for (const key of keys) {
      const type = await client.type(key);

      switch (type) {
        case 'string':
          keyValuePairs[key] = await client.get(key);
          break;
        case 'list':
          keyValuePairs[key] = await client.lRange(key, 0, -1);
          break;
        case 'set':
          keyValuePairs[key] = await client.sMembers(key);
          break;
        case 'zset':
          keyValuePairs[key] = await client.zRange(key, 0, -1);
          break;
        case 'hash':
          keyValuePairs[key] = await client.hGetAll(key);
          break;
        default:
          keyValuePairs[key] = null;
      }
    }

    res.send(keyValuePairs);
  } catch (err) {
    console.log(err)
    res.status(500).send('Error retrieving Redis keys and values');
  }
});