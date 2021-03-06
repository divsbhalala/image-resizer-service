# image-resizer-service

This serverless application deploys a Lambda function and API Gateway to your AWS account that reads images from a S3 bucket (whose name defined at deployment) and serves them through API Gateway.

The API Gateway respects the file organization on S3 bucket. For example, an image stored in s3://example-bucket/example-folder/example.jpg will be served from https://ujwegmxxah.execute-api.us-east-1.amazonaws.com/production/example-folder/example.jpg

To resize the same image, simply give dimensions as `width` and `height` GET parameters.

After deploying the application, you are strongly recommended to deploy a CDN distribution in front of API Gateway, so your responses are cached and it will improve performance and reduce costs significantly.

## License

MIT License (MIT)