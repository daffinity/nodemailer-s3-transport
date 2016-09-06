# S3 Transport for Nodemailer

Applies for Nodemailer v1.x and not for v0.x where transports are built-in.

## Usage

Install with npm

    npm install nodemailer-s3-transport

Require to your script

```javascript
var nodemailer = require('nodemailer');
var pickupTransport = require('nodemailer-s3-transport');
```

Create a Nodemailer transport object

```javascript
var transporter = nodemailer.createTransport(pickupTransport(options))
```

Where

  * **options** defines connection data
     * **bucketName** - The S3 bucket name where applications save e-mail (required)
     * **bucketRegion** - The S3 bucket region where applications save e-mail (required)

**Example**

```javascript
var transport = nodemailer.createTransport(pickupTransport({
    bucketName: 'my-s3-bucket-name-here',
    bucketRegion: 'us-east-1'
}));
```

## License

**MIT**


