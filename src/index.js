'use strict';

//import aws from 'aws-sdk';
const aws = require("aws-sdk");
const S3 = new aws.S3();
const Sharp = require('sharp');
const imageBucket = process.env.IMAGE_BUCKET;
const URL = "https://client-relation.s3.us-west-2.amazonaws.com";


const sendResponse = (callback, body, contentType, statusCode, errorMessage) => {
    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": contentType,
            "X-Error": errorMessage || null
        },
        body: body,
        isBase64Encoded: true
    };
    return callback(null, response);
};

const errorResponse = (callback, body, statusCode, err) => {

    console.log(`ERROR ${statusCode}`, err);

    const onePixelGif = [
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x04, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ];

    return sendResponse(callback, new Buffer(onePixelGif).toString('base64'), 'image/gif', statusCode, body);
};

exports.handler = (event, context, callback) => {


    if (!imageBucket) {
        callback('Error: Set environment variable IMAGE_BUCKET');
        return;
    }

    const path = event.path;
    const objectKey = path.substr(1);
    const queryParameters = event.queryStringParameters || {};


    // if (!queryParameters.width && !queryParameters.height) {
    //     return getOriginalFile(imageBucket, objectKey, callback);
    // }

    const width = parseInt(queryParameters.width);
    const height = parseInt(queryParameters.height);
	const scale = parseInt(queryParameters.height, 10);


    if ((queryParameters.width && isNaN(width)) || (queryParameters.height && isNaN(height))) {
        return errorResponse(callback, "width and height parameters must be integer", 400);
    }
	var key = objectKey;
	var originalKey = objectKey;
	var params = {
		Bucket: imageBucket,
		Key: key
	};

    //return getResizedFile(imageBucket, objectKey, width, height, queryParameters, callback);
	S3.headObject(params, function (err, metadata) {
		if (err && err.code === 'NotFound') {
			if(scale >= 3) { // wrap in canvas
				S3.getObject({Bucket: imageBucket, Key: originalKey}).promise()
				.then((data) => Sharp(data.Body)
					.rotate()
					.resize(width, height)
					.max()
					.toFormat('png')
					.toBuffer()
					.then((buffer) => Sharp(null, {
							create: {
								width: width,
								height: height,
								channels: 3,
								background: { r: 255, g: 255, b: 255 }
							}
						})
						.toFormat('png')
						.overlayWith(buffer)
						.toFormat('jpeg', {quality: 50})
						.toBuffer()
						.then((buffer) => S3.putObject({
								Body: buffer,
								Bucket: imageBucket,
								ContentType: 'image/jpeg',
								Key: key
							}).promise()
						)
					)
				)
				.then(() => context.succeed({
						statusCode: '301',
						headers: {'location': `${URL}/${key}`},
						body: ''
					})
				)
				.catch((err) => context.fail(err))
			} else if(scale >= 2) { // shrink image
				S3.getObject({Bucket: imageBucket, Key: originalKey}).promise()
				.then((data) => Sharp(data.Body)
					.rotate()
					.ignoreAspectRatio()
					.resize(width, height)
					.toFormat('jpeg', {quality: 50})
					.toBuffer()
				)
				.then((buffer) => S3.putObject({
						Body: buffer,
						Bucket: imageBucket,
						ContentType: 'image/jpeg',
						Key: key
					}).promise()
				)
				.then(() => context.succeed({
						statusCode: '301',
						headers: {'location': `${URL}/${key}`},
						body: ''
					})
				)
				.catch((err) => context.fail(err))
			} else if (scale >= 1) {  // fit image
				S3.getObject({Bucket: imageBucket, Key: originalKey}).promise()
				.then((data) => Sharp(data.Body)
					.rotate()
					.resize(width, height)
					.max()
					.toFormat('jpeg', {quality: 50})
					.toBuffer()
				)
				.then((buffer) => S3.putObject({
						Body: buffer,
						Bucket: imageBucket,
						ContentType: 'image/jpeg',
						Key: key
					}).promise()
				)
				.then(() => context.succeed({
						statusCode: '301',
						headers: {'location': `${URL}/${key}`},
						body: ''
					})
				)
				.catch((err) => context.fail(err))
			} else { // crop image
				S3.getObject({Bucket: imageBucket, Key: originalKey}).promise()
				.then((data) => Sharp(data.Body)
					.rotate()
					.resize(width, height)
					.toFormat('jpeg', {quality: 50})
					.toBuffer()
				)
				.then((buffer) => S3.putObject({
						Body: buffer,
						Bucket: imageBucket,
						ContentType: 'image/jpeg',
						Key: key
					}).promise()
				)
				.then(() => context.succeed({
						statusCode: '301',
						headers: {'location': `${URL}/${key}`},
						body: ''
					})
				)
				.catch((err) => context.fail(err))
			}
		} else {
			context.succeed({
				statusCode: '301',
				headers: {'location': `${URL}/${key}`},
				body: ''
			})
		}
	});
};