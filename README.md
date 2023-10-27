<h1>Video Conference Application using AWS Chime SDK</h1>

Ref Video: Build Video Chat Application <br>
https://www.youtube.com/watch?v=nydDw4u6hsU 

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
web/index.html<br>
The website can be accessed by using &lt;CloudFrontURL&gt;/index.html

**Javascript Code** <br>
web/assets/js/vid.js<br>
Here you must set the MEETING_SERVICE constant to point to your API ( API Gateway > Lambda function)

**NOTE: Amazon Chime SDK Endpoint has changed!** <br>
The endpoint is used in the Lambda function. <br>

Earlier there was a global endpoint (which is being deprecated): <br>
https://service.chime.aws.amazon.com 

New regional endpoints are of the form (new customers must use these): <br>
https://meetings-chime.&lt;region&gt;.amazonaws.com <br>
For eg:<br>
https://meetings-chime.us-east-1.amazonaws.com 

Complete list of endpoints available here:<br>
https://docs.aws.amazon.com/general/latest/gr/chime-sdk.html <br>
Announcement:<br>
https://github.com/aws/amazon-chime-sdk-js/issues/2697
