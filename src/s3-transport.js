'use strict';

var packageData = require('../package.json');
var crypto = require('crypto');
var AWS = require('aws-sdk');
var S3 = AWS.S3;

// expose to the world
module.exports = function (options) {
  return new S3Transport(options);
};

/**
 * <p>Generates a Transport object for S3</p>
 *
 * <p>Possible options can be the following:</p>
 *
 * <ul>
 *     <li><b>bucketName</b> - The S3 bucket name where applications save e-mail (required)</li>
 *     <li><b>bucketRegion</b> - The AWS region of the S3 bucket where applications save e-mail (required)</li>
 * </ul>
 *
 * @constructor
 * @param {Object} optional config parameter for the S3 service
 */
function S3Transport (options) {
  options = options || {};

  this.options = options;
  this.options.bucketName = options.bucketName;
  this.options.bucketRegion = options.bucketRegion;

  if (!options.bucketName) throw TypeError('S3Transport: Missing required option "bucketName"');
  if (!options.bucketRegion) throw TypeError('S3Transport: Missing required option "bucketRegion"');

  this.name = 'S3';
  this.version = packageData.version;
}


/**
 * <p>Compiles a mailcomposer message and streams it to an S3 bucket.</p>
 *
 * @param {Object} emailMessage MailComposer object
 * @param {Function} callback Callback function to run when the sending is completed
 */
S3Transport.prototype.send = function send (mail, callback) {
  // Retain BCC for later use.
  mail.message.keepBcc = true;

  var callbackSent = false;

  // TODO: Make sure this is always a random key to avoid collision with other S3 objects.
  var key = (((mail.message.getHeader('message-id') || '').replace(/[^a-z0-9\-_.@]/g, '') || crypto.randomBytes(10).toString('hex')) + '.eml');

  var messageStream = mail.message.createReadStream();

  // Upload zip stream to S3.
  var messageS3 = new S3({
    region: this.options.bucketRegion,
    params: {
      Bucket: this.options.bucketName,
      Key: key,
      // Encrypt by default.
      // TODO: Make this optional.
      ServerSideEncryption: 'AES256',
      // TODO: Ensure that we escape this and handle unicode.
      // Apply the file name on download.
      ContentDisposition: 'attachment; filename="'+ key +'"',
      // TODO: Make sure this is correct.
      ContentType: 'message/rfc822'
    }
  });


  var _onError = function _onError (msg) {
    return function _onErrorHandler (err) {
      console.error('S3Transport send: '+ msg +' Error: '+ err, err);

      if (callbackSent) return;

      callbackSent = true;
      callback(err);
    };
  };


  // Stream message to S3.
  messageS3.upload({ Body: messageStream })
    .on('error', _onError('S3 upload failed'))
    .send(function sendCallback (err, result) {
      if (err) return _onError(err, 'S3 upload send callback failed');

      if (callbackSent) return;
      callbackSent = true;

      callback(null, {
        envelope: mail.data.envelope || mail.message.getEnvelope(),
        messageId: mail.message.getHeader('message-id'),
        key: key,
        s3Receipt: result
      });
    });

  messageStream.on('error', _onError('messageStream'));
};


