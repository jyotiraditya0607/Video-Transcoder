import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const client = new SQSClient({
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    }
})

async function init(){
    const command = new ReceiveMessageCommand({
        QueueUrl:
            "",
        MaxNumberOfMessages: 1,
    });

    while (true) {
        const { Messages } = await client.send(command);
        if(!Messages) {
            console.log(`No message in the queue`);
            continue;

        }
        for (const message of Messages) {
            const { MessageId, Body } = message;
            console.log(`Message Recived`, { MessageId, Body });
        }
    }
}

init()