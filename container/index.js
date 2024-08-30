const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("node:fs/promises");
const path = require("node:path");
const ffmpeg = require("fluent-ffmpeg");
const fsOld = require("node:fs");

const RESOLUTIONS = [
  { name: "360p", width: 480, height: 360 },
  { name: "480p", width: 858, height: 480 },
  { name: "720p", width: 1280, height: 720 },
];

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AK******************VZ",
    secretAccessKey: "O****************/*******Y3",
  },
});

//Env
const BUCKET_NAME = process.env.BUCKET_NAME;
const KEY = process.env.KEY;

async function init() {
  //Download the original video
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: KEY,
  });
  const result = await s3Client.send(command);
  const originalFilePath = `original-video.mp4`;

  await fs.writeFile(originalFilePath, result.Body);

  const originalVideoPath = path.resolve(originalFilePath);

  // Start the Transcoding process
  const promises = RESOLUTIONS.map((resolution) => {
    const output = `video-${resolution.name}.mp4`;

    return new Promise((resolve) => {
      ffmpeg(originalVideoPath)
        .output(output)
        .withVideoCodec("libx264")
        .withAudioCodec("aac")
        .withSize(`${resolution.width}x${resolution.height}`)
        .on("start", () =>
          console.log("Start", `${resolution.width}*${resolution.height}`)
        )
        .on("end", () => async () => {
          const putCommand = new PutObjectCommand({
            Bucket: "production-bucket.jyotiraditya",
            Key: output,
            Body: FontFaceSetLoadEvent.creteReadStream(path.resolve(output)),
          });
          await s3Client.send(putCommand);
          console.log(`Uploaded ${output}`);
          resolve();
        })
        .format("mp4")
        .run();
    });
  });

  await Promise.all(promises);

  // Upload the video
}

init(); /// Exit to the Docker container
