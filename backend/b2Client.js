const { S3 } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

const b2 = new S3({
  endpoint: process.env.B2_ENDPOINT_URL,
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_ACCESS_KEY,
    secretAccessKey: process.env.B2_SECRET_KEY
  }
});

module.exports = { b2, createPresignedPost };