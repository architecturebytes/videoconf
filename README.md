# Video Conference Application using AWS Chime SDK

**_Generate Amazon Chime SDK Javascript Client Library - single file_**

git clone https://github.com/aws-samples/amazon-chime-sdk.git
cd amazon-chime-sdk/utils/singlejs

Here make sure that src/index.js looks like this (update it if necessary):
export * as default from 'amazon-chime-sdk-js';

npm install
npm run bundle

This will generate amazon-chime-sdk.min.js in build directory.

**_Lambda function_**
server/lambda/index.js
This is a Lambda function you need to create in AWS.

**_HTML file_**
web/index.html
This is html file you need to host.

**_Javascript Code_**
web/assets/js/vid.js

