# Video Conference Application using AWS Chime SDK

We are using plain Javascript without any frameworks like ReactJS etc.

**Generate Amazon Chime SDK Javascript Client Library - single file** <br>

git clone https://github.com/aws-samples/amazon-chime-sdk.git <br>
cd amazon-chime-sdk/utils/singlejs

Here make sure that src/index.js looks like this (update it if necessary): <br>
export * as default from 'amazon-chime-sdk-js';

npm install <br>
npm run bundle

This will generate amazon-chime-sdk.min.js in build directory.

**Lambda function** <br>
server/lambda/index.js

**HTML file** <br>
web/index.html
This is html file you need to host.

**Javascript Code** <br>
web/assets/js/vid.js

