import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify'
import Kafka from 'kafka-node'
const fastify = Fastify({
  logger: true
})


const kafkaHost = 'kafka:29092';
const client = new Kafka.KafkaClient({ kafkaHost });


const admin = new Kafka.Admin(client);

// Nome do tópico a ser criado
const topicName = 'balances';

// Detalhes do tópico a ser criado
const topics = [{
    topic: topicName,
    partitions: 1, // Número de partições
    replicationFactor: 1 // Fator de replicação
}];

// Criar o tópico
await admin.createTopics(topics, (err, res) => {
    if (err) {
        console.error('Erro ao criar o tópico:', err);
    } else {
        console.log('Tópico criado com sucesso:', res);
    }
});

const Consumer = new Kafka.Consumer(client, [{ topic: 'balances', partition: 0 }], { autoCommit: true });

Consumer.on('error', function (err) {
  // Verifica se o erro é devido à inexistência do tópico "balances"
  if (err && err.name === 'TopicsNotExistError' && err.topics && err.topics.includes('balances')) {
      console.log('O tópico "balances" não existe.');
      // Lida com a situação de forma adequada, por exemplo, tentando criar o tópico novamente ou outro tratamento
  } else {
      // Outros erros que podem precisar de tratamento
      console.error('Erro:', err);
  }
});


try {
Consumer.on('message', async function (message) {
  const payload = JSON.parse(message.value)["Payload"]
  const  client = new PrismaClient();
  console.log(payload)
 
    await client.account.upsert({
      create: {
        id: payload.account_id_from,
        balance: payload.balance_account_id_from
      },
      update:{
        balance: payload.balance_account_id_from
      },
      where:{
        id: payload.account_id_from
      }
    });
    await client.account.upsert({
      create: {
        id: payload.account_id_to,
        balance: payload.balance_account_id_to
      },
      update:{
        balance: payload.balance_account_id_to
      },
      where:{
        id: payload.account_id_to
      }
    });
});
} catch (error) {
  console.log(error)
}

fastify.get('/', async (request, reply) => {
    reply.send({ message: 'Hello from Fastify!' });
});

fastify.get('/account/:id', async (request, reply) => {
  const { id } = request.params;
  const client = new PrismaClient();
  const account = await client.account.findUnique({
    where: {
      id: id,
    },
  });
  reply.send(
    account
  );
});


// Run the server!
try {
  await fastify.listen({ port: 3003,host:"0.0.0.0" })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}