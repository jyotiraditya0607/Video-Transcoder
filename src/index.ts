import { ReceiveMessageCommand, SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import {ECSClient, RunTaskCommand} from '@aws-sdk/client-ecs';
import type {S3Event} from 'aws-lambda';

const client = new SQSClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AK*************Z",
        secretAccessKey: "Ox************************Y3",
    }
})

const escClient = new ECSClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AK*************Z",
        secretAccessKey: "Ox************************Y3",
    }
})

async function init(){
    const command = new ReceiveMessageCommand({
        QueueUrl:
            "https://sqs.us-east-1.amazonaws.com/47343434343434/name-of-the-queue",
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
    });

    while (true) {
        const { Messages } = await client.send(command);
        if(!Messages) {
            console.log(`No message in the queue`);
            continue;

        } 
        try {
            for (const message of Messages) {
            const { MessageId, Body } = message;
            console.log(`Message Received`, { MessageId, Body });

            if(!Body) {
                console.log(`No Body in the message`);
                continue;
            }

            //Validate & Parse the message
            const event = JSON.parse(Body) as S3Event;

            //If Event is  a test event, then just continue
            if("Service" in event && "Event" in event) {
                if(event.Event === "s3:TestEvent") {
                    await client.send(
                    new DeleteMessageCommand({
                        QueueUrl: "https://sqs.us-east-1.amazonaws.com/738273827382/name-of-the-queue",
                        ReceiptHandle: message.ReceiptHandle,
                    })
                );
                continue;
                }
            }



            for(const record of event.Records) {
                const {s3} = record;
                const {
                    bucket,
                    object: {key},
                } = s3;
            //Spin the Docker Container
            const runTaskCommand = new RunTaskCommand({
                taskDefinition: "arn:aws:ecs:us-east-*************************",
                cluster: "arn:aws:ecs:us-east-1:***********************",
                launchType: "FARGATE",
                networkConfiguration: {
                    awsvpcConfiguration: {
                        assignPublicIp: "ENABLED",
                        securityGroups: ["sg-************"],
                        subnets: ['subnet-0e6493061e16cdc85', 'subnet-0df72344b52baef18', 'subnet-049d27e6c011a1ce7']
                    },
                },
                overrides: {
                    containerOverrides: [{ name: "video-transcoder", environment: [{ name: "BUCKET_NAME", value: bucket.name }, {name: "KEY", value: key}]}]
                }
            });

                await escClient.send(runTaskCommand);
                //Delete the message
                await client.send(
                    new DeleteMessageCommand({
                        QueueUrl: "https://sqs.us-east-1.amazonaws.com/78573457348578435/name-of-the-queue",
                        ReceiptHandle: message.ReceiptHandle,
                    })
                );

                }
            }
        } catch (error) {
            console.log(error);
        }
    }
}

init()