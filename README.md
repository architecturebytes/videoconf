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

**How to create an API (Gateway)**

_Create API_ <br>
In AWS Console > API Gateway > Create API > Choose API Type > HTTP API > Build > <br>
Provide API Name 'byte-meeting' > For 'Configure Routes' Hit Next > For 'Configure Stages' Hit Next > Review & Create 

_Configure Routes_ <br>
Select Routes on left menu > Hit 'Create' on right pane > Choose Method 'ANY' Route '/bytes-meeting' > Create > <br>
Select the newly created route/method > Select 'Attach Integration' > 'Create and Attach Integration' <br>
Choose Integration Target - Integration Type from dropdown : Lambda function , Choose AWS Region , <br>
Select 'bytes-meeting' lambda function ARN <br>
Make sure "Grant API Gateway permission to invoke your Lambda function" is checked > Hit Create 

_Enable CORS (Optional)_ <br>
Select CORS on left menu > Hit Configure button on right 	<br>
Add * against Access-Control-Allow-Origin hit Add <br>
Add * against Access-Control-Allow-Headers hit Add <br>
Choose * against Access-Control-Allow-Methods hit Add <br>
Leave everything else as default <br>
Save 

_Deploy API_ <br>
Select Deploy menu on left > Select Stages > Select your stage $default <br>
Check if under Attached Deployment: Automatic Deployment is Enabled. If yes, you are all set. <br>
If not you must hit the Deploy button at top right to deploy your API 


**NOTE: Amazon Chime SDK Endpoint has changed!** <br>
The endpoint is used in the Lambda function. <br>

Earlier there was a global endpoint (which is being deprecated): <br>
https://service.chime.aws.amazon.com 

New regional endpoints are of the form (new customers must use these): <br>
https://meetings-chime.[RegionHere].amazonaws.com <br>
For eg:<br>
https://meetings-chime.us-east-1.amazonaws.com 

Complete list of endpoints available here:<br>
https://docs.aws.amazon.com/general/latest/gr/chime-sdk.html <br>
Ref:<br>
https://docs.aws.amazon.com/chime-sdk/latest/dg/migrate-from-chm-namespace.html <br>
https://github.com/aws/amazon-chime-sdk-js/issues/2697
