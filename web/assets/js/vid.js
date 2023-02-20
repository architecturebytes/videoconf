		const MEETING_PATH = "https://7j7z5e6e81.execute-api.us-east-1.amazonaws.com/bytes-meeting";
		var startButton = document.getElementById("start-button");
		var stopButton = document.getElementById("stop-button");	
		var exitButton = document.getElementById("exit-button");	
		var shareButton = document.getElementById("share-button");	
		var isScreenShared = false;

		var urlParams = new URLSearchParams(window.location.search);
		
		function generateString() {
			return (
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15)
			);
		}
	
		var isMeetingHost = false;
		var meetingId = urlParams.get("meetingId");
		var attendeeId = "";
		var userName = "";
		var clientId = generateString();
		const attendees = new Set();

		const logger = new window.ChimeSDK.ConsoleLogger(
			"ChimeMeetingLogs",
			ChimeSDK.LogLevel.INFO
		);
		const deviceController = new ChimeSDK.DefaultDeviceController(logger);		
		let requestPath = MEETING_PATH +`?clientId=${clientId}`;

		if (!meetingId) {
			isMeetingHost = true;
		} else {
			requestPath += `&meetingId=${meetingId}`;
		}

		if (!isMeetingHost) {
			startButton.innerText = "Join Meeting";
			exitButton.style.display = "inline-block";
		} else {
			startButton.innerText = "Start Meeting";
			stopButton.style.display = "inline-block";
		}

		startButton.style.display = "inline-block";
		shareButton.style.display = "inline-block";
		
		async function start() {
			userName = document.getElementById("username").value;
			if (userName.length==0) {
				alert("Please enter username");
				return;
			}

			if (userName.indexOf("#")>=0)
			{
				alert("Please do not use special characters in User Name");
				return;
			}

			if (window.meetingSession) {
				//alert("Meeting Session Already Present! Returning");
				return;
			}
			try {
				var response = await fetch(requestPath, {
					method: "POST",
					headers: new Headers(),
					body: JSON.stringify({action: "DO_MEETING", MEETING_ID: `${meetingId}`, USERNAME: `${userName}`})
				});

				const data = await response.json();
				meetingId = data.Info.Meeting.Meeting.MeetingId;
				attendeeId = data.Info.Attendee.Attendee.AttendeeId;
				
				document.getElementById("meeting-Id").innerText =  meetingId;
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
						if (!(meetingSession === null))
						{
							updateTiles(meetingSession);
						}						
					},
				};
				
				await meetingSession.audioVideo.addObserver(observer);	
				meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(attendeeObserver);
				meetingSession.eventController.addObserver(eventObserver);
			
				const audioOutputElement = document.getElementById("meeting-audio");
				meetingSession.audioVideo.bindAudioElement(audioOutputElement);
				meetingSession.audioVideo.start();
				meetingSession.audioVideo.startLocalVideoTile();
			}
			catch(err)
			{
				console.error("Error: " + err);
			}
		}
						
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


		function attendeeObserver(attendeeId, present, externalUserId, dropped, posInFrame) {
					if (!present)
					{						
						const elements = document.getElementsByName("div-"+ attendeeId);
						console.log("NOTE elements length:" + elements.length);
						elements[0].remove();
					}

					//document.getElementById("Attendees").innerText = document.getElementById("Attendees").innerText + attendeeId + "(" + present + " - " + dropped + " - " + posInFrame.attendeeIndex  + ") | ";
					/*
					seperator = " | ";
					if (document.getElementById("Attendees").innerText === "")
					{
						seperator = "";
					}
					document.getElementById("Attendees").innerText = document.getElementById("Attendees").innerText + seperator + externalUserId.substring(0, externalUserId.indexOf("#"));
					*/
					console.log("NOTE: attendeeId: " + attendeeId);
					console.log("NOTE: externalUserId: " + externalUserId);
					attendeeUserName =  externalUserId.substring(0, externalUserId.indexOf("#"));
					if (present)
					{
						attendees.add(attendeeUserName);
					}
					else
					{
						if (! (attendeeId.indexOf("#content")>=0) )
						{
							attendees.delete(attendeeUserName);
						}						
					}
					
					attendeeStr = "";
					for (const item of attendees) {
 					 	attendeeStr = attendeeStr + item + " | ";
					}
					attendeeStr = attendeeStr.slice(0,-3);

					document.getElementById("Attendees").innerText = attendeeStr;
				};
		
				const eventObserver = {
					eventDidReceive: (name, attribute) => {
						console.log("NOTE eventDidReceive name - " + name);
					}
				}
		
		async function stop() {
			try {
				var response = await fetch(requestPath, {
					method: "POST",
					headers: new Headers(),
					body: JSON.stringify({action: "END_MEETING", MEETING_ID: `${meetingId}`})
				});

				const data = await response.json();
				console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
				meetingSession.deviceController.destroy();

				window.meetingSession = null;
				meetingId = null;
				document.getElementById("video-list").replaceChildren();
		}
		catch(err)
		{
			console.error("NOTE Error: " + err);
		}
	}

	async function exitMeeting() {
			try {
				var response = await fetch(requestPath, {
					method: "POST",
					headers: new Headers(),
					body: JSON.stringify({action: "DELETE_ATTENDEE", MEETING_ID: `${meetingId}`, ATTENDEE_ID: `${attendeeId}`})
				});

				const data = await response.json();
				console.log("NOTE: END MEETING RESPONSE " + JSON.stringify(data));
				meetingSession.deviceController.destroy();

				window.meetingSession = null;
				meetingId = null;
				document.getElementById("video-list").replaceChildren();
		}
		catch(err)
		{
			console.error("Error: " + err);
		}
	}
		

	async function share() {
		try {
				if (window.meetingSession)
					{
						if (isScreenShared)
						{
							await meetingSession.audioVideo.stopContentShare();	
							shareButton.innerText = "Start Screen Share";
							isScreenShared = false;
						}
						else 
						{
							await meetingSession.audioVideo.startContentShareFromScreenCapture();
							shareButton.innerText = "Stop Screen Share";
							isScreenShared = true;
						}
					}
					else
					{
						alert("Please start meeting first.");
					}
		}
		catch(err)
		{
			console.error("Error: " + err);
		}
	}



		window.addEventListener("DOMContentLoaded", () => {
			startButton.addEventListener("click", start);

			if (isMeetingHost) {
				stopButton.addEventListener("click", stop);
			}
			else{
				exitButton.addEventListener("click", exitMeeting);
			}

			shareButton.addEventListener("click", share);
		});