const MEETING_SERVICE = "https://7j7z5e6e81.execute-api.us-east-1.amazonaws.com/bytes-meeting";

var isMeetingHost = false;
var meetingId = "";
var attendeeId = "";
var userName = "";
var clientId = "";
var isScreenShared = false;
const attendees = new Set();

var urlParams = new URLSearchParams(window.location.search);

// meetingId will be available if a user tries to join a meeting via a meeting URL
meetingId = urlParams.get("meetingId");

// Generate a unique client Id for the user
clientId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

let requestPath = MEETING_SERVICE + `?clientId=${clientId}`;

// Setup logger
const logger = new window.ChimeSDK.ConsoleLogger(
	"ChimeMeetingLogs",
	ChimeSDK.LogLevel.INFO
);

const deviceController = new ChimeSDK.DefaultDeviceController(logger);

// If meetingId is not available, then user is the meeting host.
if (!meetingId) {
	isMeetingHost = true;
}

var startButton = document.getElementById("start-button");
var stopButton = document.getElementById("stop-button");
var exitButton = document.getElementById("exit-button");
var shareButton = document.getElementById("share-button");

if (isMeetingHost) {
	startButton.innerText = "Start Meeting";
	stopButton.style.display = "inline-block";
} else {
	startButton.innerText = "Join Meeting";
	exitButton.style.display = "inline-block";
	requestPath += `&meetingId=${meetingId}`;
}

startButton.style.display = "inline-block";
shareButton.style.display = "inline-block";

// Create or Join Meeting
async function doMeeting() {
	userName = document.getElementById("username").value;
	if (userName.length == 0) {
		alert("Please enter username");
		return;
	}

	if (userName.indexOf("#") >= 0) {
		alert("Please do not use special characters in User Name");
		return;
	}

	//If Meeting session already present, return.
	if (window.meetingSession) {
		//alert("Meeting already in progress");
		return;
	}
	try {
		//Send request to service(API Gateway > Lambda function) to start/join meeting.
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ action: "DO_MEETING", MEETING_ID: `${meetingId}`, USERNAME: `${userName}` })
		});

		const data = await response.json();
		
		if (! data.hasOwnProperty('Info')) {
			alert("Oops! There was a problem - the meeting might have ended!");
			console.log("NOTE: Meeting was not Found");	
			return;
		}

		meetingId = data.Info.Meeting.Meeting.MeetingId;
		attendeeId = data.Info.Attendee.Attendee.AttendeeId;

		document.getElementById("meeting-Id").innerText = meetingId;
		if (isMeetingHost) {
			document.getElementById("meeting-link").innerText = window.location.href + "?meetingId=" + meetingId;
		}

		const configuration = new ChimeSDK.MeetingSessionConfiguration(
			data.Info.Meeting.Meeting,
			data.Info.Attendee.Attendee
		);
		window.meetingSession = new ChimeSDK.DefaultMeetingSession(
			configuration,
			logger,
			deviceController
		);

		const audioInputs = await meetingSession.audioVideo.listAudioInputDevices();
		const videoInputs = await meetingSession.audioVideo.listVideoInputDevices();

		await meetingSession.audioVideo.startAudioInput(audioInputs[0].deviceId);
		await meetingSession.audioVideo.startVideoInput(videoInputs[0].deviceId);

		const observer = {
			videoTileDidUpdate: (tileState) => {
				if (!tileState.boundAttendeeId) {
					return;
				}
				if (!(meetingSession === null)) {
					updateTiles(meetingSession);
				}
			},
		};

		const eventObserver = {
			eventDidReceive(name, attributes) {
				switch (name) {
					case 'meetingEnded':
					  cleanup();
					  console.log("NOTE: Meeting Ended", attributes);
					  break;
					case 'meetingReconnected':
					  console.log('NOTE: Meeting Reconnected...');
					  break;
			}
		  }
		}

		// Add observers for the meeting.
		meetingSession.audioVideo.addObserver(observer);
		meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(attendeeObserver);
		meetingSession.eventController.addObserver(eventObserver);

		const audioOutputElement = document.getElementById("meeting-audio");
		meetingSession.audioVideo.bindAudioElement(audioOutputElement);
		meetingSession.audioVideo.start();
		meetingSession.audioVideo.startLocalVideoTile();
	}
	catch (err) {
		console.error("Error: " + err);
	}
}

// Update Video Tiles on UI
function updateTiles(meetingSession) {
	const tiles = meetingSession.audioVideo.getAllVideoTiles();
	tiles.forEach(tile => {
		let tileId = tile.tileState.tileId
		var videoElement = document.getElementById("video-" + tileId);
		if (!videoElement) {
			divElement = document.createElement("div");
			divElement.id = "div-" + + tileId;
			divElement.setAttribute("name", "div-" + tile.tileState.boundAttendeeId);
			divElement.style.display = "inline-block";
			divElement.style.padding = "5px";
			videoElement = document.createElement("video");
			videoElement.id = "video-" + tileId;
			videoElement.setAttribute("name", "video-" + tile.tileState.boundAttendeeId);
			videoElement.controls = true;
			p = document.createElement("p");
			p.style.color="blueviolet";
			//p.textContent = tile.tileState.boundExternalUserId;
			boundExtUserId = tile.tileState.boundExternalUserId
			p.textContent = boundExtUserId.substring(0, boundExtUserId.indexOf("#"));
			divElement.append(p);
			divElement.append(videoElement);
			document.getElementById("video-list").append(divElement);
			meetingSession.audioVideo.bindVideoElement(
				tileId,
				videoElement
			);
		}
	})
}

// Attendee presence check
// Update the attendees set and div video tiles display based on this.
function attendeeObserver(attendeeId, present, externalUserId, dropped, posInFrame) {

	//Get Attendee User Name from externalUserId where it was set while joining meeting
	attendeeUserName = externalUserId.substring(0, externalUserId.indexOf("#"));

	// If attendee present, add to attendees set.
	if (present) {
		attendees.add(attendeeUserName);
	}
	else {
		// Attendee no longer present, remove the display div video tile
		const elements = document.getElementsByName("div-" + attendeeId);
		elements[0].remove();

		// For screen share attendeeId comes with #content suffix.
		// Do not remove user from attendees if this is screen share closure update
		if (!(attendeeId.indexOf("#content") >= 0)) {
			attendees.delete(attendeeUserName);
		}
	}

	refreshAttendeesDisplay();
};

function refreshAttendeesDisplay()
{
	//Create list of attendees from attendees set, and then display.
	attendeeStr = "";
	for (const item of attendees) {
		attendeeStr = attendeeStr + item + " | ";
	}
	attendeeStr = attendeeStr.slice(0, -3);

	document.getElementById("Attendees").innerText = attendeeStr;
}

// Stop Meeting		
async function stopMeeting() {
	//Send request to service(API Gateway > Lambda function) to end the Meeting
	try {
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ action: "END_MEETING", MEETING_ID: `${meetingId}` })
		});

		const data = await response.json();
		console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
		//meetingSession.deviceController.destroy();

		cleanup();
	}
	catch (err) {
		console.error("NOTE Error: " + err);
	}
}

// Leave Meeting
async function exitMeeting() {
	//Send request to service(API Gateway > Lambda function) to delete Attendee Id from meeting.
	try {
		var response = await fetch(requestPath, {
			method: "POST",
			headers: new Headers(),
			body: JSON.stringify({ action: "DELETE_ATTENDEE", MEETING_ID: `${meetingId}`, ATTENDEE_ID: `${attendeeId}` })
		});

		const data = await response.json();
		console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
		//meetingSession.deviceController.destroy();

		cleanup();
	}
	catch (err) {
		console.error("Error: " + err);
	}
}

function cleanup()
{
	console.log("NOTE: cleanuP called!!!!");
	meetingSession.deviceController.destroy();
	window.meetingSession = null;
	//if meeting host - don't preserve the meeting id.
	if (isMeetingHost)
	{
		meetingId = null;
	}
	document.getElementById("video-list").replaceChildren();
	attendees.clear();
	document.getElementById("meeting-link").innerText = "";
	refreshAttendeesDisplay();
}

// Toggle Screen Share
async function share() {
	try {
		if (window.meetingSession) {
			if (isScreenShared) {
				await meetingSession.audioVideo.stopContentShare();
				shareButton.innerText = "Start Screen Share";
				isScreenShared = false;
			}
			else {
				await meetingSession.audioVideo.startContentShareFromScreenCapture();
				shareButton.innerText = "Stop Screen Share";
				isScreenShared = true;
			}
		}
		else {
			alert("Please start or join a meeting first!");
		}
	}
	catch (err) {
		console.error("Error: " + err);
	}
}



window.addEventListener("DOMContentLoaded", () => {

	startButton.addEventListener("click", doMeeting);

	if (isMeetingHost) {
		stopButton.addEventListener("click", stopMeeting);
	}
	else {
		exitButton.addEventListener("click", exitMeeting);
	}

	shareButton.addEventListener("click", share);
});