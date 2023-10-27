const AWS = require("aws-sdk");

const chime = new AWS.Chime();

// Set the AWS SDK Chime endpoint. T

//Deprecated global endpoint: https://service.chime.aws.amazon.com.
//chime.endpoint = new AWS.Endpoint("https://service.chime.aws.amazon.com");

//Use this new regional endpoint. https://meetings-chime.<region>.amazonaws.com"
//Replace region as needed. Using 'us-east-1' in this example.
chime.endpoint = new AWS.Endpoint("https://meetings-chime.us-east-1.amazonaws.com");

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

// Create or join existing meeting
async function doMeeting(event) {
    
    const query = event.queryStringParameters;
        
    let meetingId = "";
    let meeting = null;
    let userName = "";
    
     const theBodyContent = JSON.parse(event.body);
     meetingId = theBodyContent.MEETING_ID;
     userName = theBodyContent.USERNAME;
    
    if ((meetingId === "") || (meetingId === null) || (meetingId === "null")) {
        // New meeting

         meetingToken = create_UUID();
         console.log("NOTE: NEW MEETING");
        meeting = await chime
            .createMeeting({
                ClientRequestToken: meetingToken,
                MediaRegion: "us-east-1",
                ExternalMeetingId: meetingToken,
            })
            .promise();
    } else {
        // Join existing meeting
        
        // Fetch meeting details
        try {
             meetingId = query.meetingId;
             meeting = await chime.getMeeting({
                MeetingId: meetingId,
            })
            .promise();
        } catch (e) {
            if (e.code == "NotFound")
            {
                console.log("Meeting Not Found");
            }
            //console.log("ERROR while Getting Meeting Details " + JSON.stringify(e));
            return json(200, "application/json", {}); //Meeting Id not found, return.
        }
       
    }
            
    // Add attendee to the meeting (new or existing)
    const attendee = await chime
        .createAttendee({
            MeetingId: meeting.Meeting.MeetingId,
            ExternalUserId: `${userName}#${query.clientId}`,
        })
        .promise();

    return json(200, "application/json", {
        Info: {
            Meeting: meeting,
            Attendee: attendee,
        },
    });
};

// Delete attendee from the meeting
async function deleteAttendee(event) {
    const body = JSON.parse(event.body);
    const deleteRequest = await chime.deleteAttendee({
        MeetingId: body.MEETING_ID,
        AttendeeId: body.ATTENDEE_ID
    }).promise();
    return json(200, "application/json", {});
};


// Delete the meeting
async function deleteMeeting(event) {
    const body = JSON.parse(event.body);
    console.log("NOTE end func: Meeting ID Received: " + body.MEETING_ID);
    const deleteRequest = await chime.deleteMeeting({
        MeetingId: body.MEETING_ID
    }).promise();
    return json(200, "application/json", {});
};

exports.handler = async (event, context, callback) => {
    const bodyContent = JSON.parse(event.body);
    if (bodyContent.action == "DO_MEETING")
    {
           return doMeeting(event);
    }
    else if (bodyContent.action == "DELETE_ATTENDEE")
    {
          return deleteAttendee(event);
    }
    else if (bodyContent.action == "END_MEETING")
    {
          return deleteMeeting(event);
    }
    else
    {
            console.log("Event Unrecognized");
            return json(200, "application/json", {});
    }
 
}
