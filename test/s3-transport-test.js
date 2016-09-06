'use strict';

var chai = require('chai');
var expect = chai.expect;
var s3Transport = require('../src/s3-transport');
chai.Assertion.includeStack = true;
var crypto = require('crypto');
var fs = require('fs');

var randomBytes = crypto.randomBytes(20).toString('hex');

function MockBuilder(envelope, message) {
  this.envelope = envelope;
  this.message = new(require('stream').PassThrough)();
  this.message.end(message);
}

MockBuilder.prototype.getEnvelope = function() {
  return this.envelope;
};

MockBuilder.prototype.createReadStream = function() {
  return this.message;
};

MockBuilder.prototype.getHeader = function() {
  return randomBytes;
};

describe('S3 Transport Tests', function() {
  it('Should expose version number', function() {
    var client = s3Transport();
    expect(client.name).to.exist;
    expect(client.version).to.exist;
  });

  // TODO: Implement mock S3 for these tests.

  xit('Should send message', function(done) {
    var client = s3Transport();

    client.send({
      data: {},
      message: new MockBuilder({
        from: 'test@valid.sender',
        to: 'test@valid.recipient'
      }, 'message')
    }, function(err, data) {
      expect(err).to.not.exist;
      expect(data.messageId).to.equal(randomBytes);
      expect(data.path).to.contain(randomBytes + '.eml');

      fs.unlink(data.path, done);
    });
  });

  xit('Should return an error', function(done) {
    var client = s3Transport({
      // use a made up directory that most probably does not exist
      directory: '/MqauOobH6mgKoL/6pRiNkj7hTEtIA/9YhF9hY115v4I/hqR730EKY7I96G/PILrwPJ45NeCNo'
    });

    client.send({
      data: {},
      message: new MockBuilder({
        from: 'test@valid.sender',
        to: 'test@valid.recipient'
      }, 'message')
    }, function(err, data) {
      expect(err).to.exist;
      expect(data).to.not.exist;

      done();
    });
  });
});
