const AWS = require("aws-sdk");

const chime = new AWS.Chime();
////const { v4: uuidv4 } = require("uuid"); 

// Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

const json = (statusCode, contentType, body) => {
    return {
        statusCode,
        headers: { "content-type": contentType },
        body: JSON.stringify(body),
    };
};

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

console.log(create_UUID());


//exports.join = async (event, context, callback) => {
async function join(event) {
    console.log("NOTE: entered join");
    const query = event.queryStringParameters;
        console.log("NOTE: query " + query);
    let meetingId = "";
    let meeting = null;
    let userName = "";
    
     const theBodyContent = JSON.parse(event.body);
     meetingId = theBodyContent.MEETING_ID;
     userName = theBodyContent.USERNAME;
     console.log("NOTE: MEETING ID FOUND: " + meetingId);
    if ((meetingId === "") || (meetingId === null) || (meetingId === "null")) {
        ////new meeting
        //meetingId = uuidv4();
         meetingId = create_UUID();
         console.log("NOTE: NEW MEETING");
        meeting = await chime
            .createMeeting({
                ClientRequestToken: meetingId,
                MediaRegion: "us-east-1",
                ExternalMeetingId: meetingId,
            })
            .promise();
    } else {
        //join to old meeting
        console.log("NOTE: EXISTING MEETING");
        meetingId = query.meetingId;
        meeting = await chime
            .getMeeting({
                MeetingId: meetingId,
            })
            .promise();
    }
            
    console.log("NOTE: MEETING Just before adding attendee: " + JSON.stringify(meeting) );
    //We've initialized our meeting! Now let's add attendees.
    const attendee = await chime
        .createAttendee({
            //ID of the meeting
            MeetingId: meeting.Meeting.MeetingId,

            //User ID that we want to associate to
            ////ExternalUserId: `${uuidv4().substring(0, 8)}#${query.clientId}`,
            ////ExternalUserId: toString(Math.floor((Math.random() * 99000) + 10000)) + `#${query.clientId}`,
            //ExternalUserId: `${create_UUID().substring(0, 8)}#${query.clientId}`,
            ExternalUserId: `${userName}#${query.clientId}`,
        })
        .promise();

    console.log("NOTE: MEETING After adding attendee: " + JSON.stringify(attendee) );

    return json(200, "application/json", {
        Info: {
            Meeting: meeting,
            Attendee: attendee,
        },
    });
};


async function deleteAttendee(event) {
    const body = JSON.parse(event.body);
    console.log("NOTE deleteAttendee: Meeting ID Received: " + body.MEETING_ID);
    console.log("NOTE deleteAttendee: Meeting ID Received: " + body.ATTENDEE_ID);
    const deleteRequest = await chime.deleteAttendee({
        MeetingId: body.MEETING_ID,
        AttendeeId: body.ATTENDEE_ID
    }).promise();
    return json(200, "application/json", {});
};



async function end(event) {
    const body = JSON.parse(event.body);
    console.log("NOTE end func: Meeting ID Received: " + body.MEETING_ID);
    const deleteRequest = await chime.deleteMeeting({
        MeetingId: body.MEETING_ID
    }).promise();
    return json(200, "application/json", {});
};

////const StaticFileHandler = require('serverless-aws-static-file-handler')

exports.handler = async (event, context, callback) => {
    ////const clientFilesPath = __dirname + "/html/";
    ////const fileHandler = new StaticFileHandler(clientFilesPath)
    ////return await fileHandler.get(event,context);
    //// return json(200, "application/json", {});
    //event.queryStringParameters = {};
    console.log("NOTE EVENT RECEIVED: " + JSON.stringify(event));
    const bodyContent = JSON.parse(event.body);
    if (bodyContent.action == "DO_MEETING")
    {
           return join(event);
    }
    else if (bodyContent.action == "DELETE_ATTENDEE")
    {
          return deleteAttendee(event);
    }
    else if (bodyContent.action == "END_MEETING")
    {
          return end(event);
    }
    else
    {
            console.log("EVENT UNRECOGNIZED");
    }
 
}