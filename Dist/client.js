var inputMode = "default"; // {"default", "joystick", "oculus"}. default is keyboard or touchpad.
var controlMode = "motion"; // {"motion", "manual", "DP"}
var runMode = "normal"; // {"normal", "simulation"};
var keysPressed = [false, false, false, false, false, false];
var joystickValue = {RIGHT_STICK_X: 2, RIGHT_STICK_Y: 2, LEFT_STICK_Y: 2};
var initialized = 0;
var displayDevMode = true;
var epsilon = 0.1;



// ########################
//
// Handle the panel to the bot left;
// forms, buttons, measurement etc.
//
// ########################

function handleRunModeChange(){
	var form = document.runModeForm;

	form.elements[0].onclick = function(){
		if(runMode == "simulation"){
			runMode = "normal";
			io.emit("command", {type:"runmode-normal"});
			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Run mode changed. Stopping."});
		}
	}

	form.elements[1].onclick = function(){
		if(runMode == "normal"){
			runMode = "simulation";
			io.emit("command", {type:"runmode-simulation"});
			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Run mode changed. Stopping."});
		}
	}
}

function handleInputModeChange(){
	var form = document.inputModeForm;

	form.elements[0].onclick = function(){
		if(inputMode != "default"){
			inputMode = "default";

			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Input mode changed. Stopping."});
		}
	}

	form.elements[1].onclick = function(){
		if(inputMode != "joystick"){
			inputMode = "joystick";

			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Input mode changed. Stopping."});
		}
	}


	form.elements[2].onclick = function(){
		if(inputMode != "oculus"){
			inputMode = "oculus";

			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Input mode changed. Stopping."});
		}
	}
}

function handleControlModeChange(){
	var form = document.controlModeForm;

	form.elements[0].onclick = function(){
		if(controlMode != "motion"){
			controlMode = "motion";

			willEnableMotionControlFunctions(true);
			setControlImages("motion");
			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Control mode changed. Stopping."});
		}
	}

	form.elements[1].onclick = function(){
		if(controlMode != "manual"){
			controlMode = "manual";

			willEnableMotionControlFunctions(false);
			setControlImages("manual");
			io.emit("command", {type:"stop"});
			displayInScrollWindow({logType:"Stop", data: "Control mode changed. Stopping."});
		}
	}

	form.elements[2].onclick = function(){
		if(controlMode != "DP"){
			controlMode = "DP";

			willEnableMotionControlFunctions(false);
			setControlImages("motion");
			io.emit("command", {type:"stop"});
			io.emit("command", {type:"dp"});
			displayInScrollWindow({logType:"Stop", data: "Control mode changed. Stopping."});
		}
	}
}

function willEnableMotionControlFunctions(enable){
	document.getElementById("autoHeading").disabled=!enable;
	document.getElementById("autoHeadingButton").disabled=!enable;
	document.getElementById("autoDepth").disabled=!enable;
	document.getElementById("autoDepthButton").disabled=!enable;
}

function setControlImages(type){
	var img1 = document.getElementById("forward");
	var img2 = document.getElementById("backward");
	var img3 = document.getElementById("rot_cc");
	var img4 = document.getElementById("rot_c");
	var img5 = document.getElementById("up");
	var img6 = document.getElementById("down");

	if(type == "manual"){
		img1.setAttribute("src", "/images/thruster1_forward.png");
		img2.setAttribute("src", "/images/thruster1_backward.png");
		img3.setAttribute("src", "/images/thruster3_forward.png");
		img4.setAttribute("src", "/images/thruster3_backward.png");
		img5.setAttribute("src", "/images/thruster2_backward.png");
		img6.setAttribute("src", "/images/thruster2_forward.png");
	}else{
		img1.setAttribute("src", "/images/forward.png");
		img2.setAttribute("src", "/images/backward.png");
		img3.setAttribute("src", "/images/rot_cc.png");
		img4.setAttribute("src", "/images/rot_c.png");
		img5.setAttribute("src", "/images/up.png");
		img6.setAttribute("src", "/images/down.png");
	}
}


function handleDepthAutopilotButton(){
	var form = document.getElementById("autoDepthForm");
	var depthButton = document.getElementById("autoDepthButton");
	var status = document.getElementById("autoDepthPrint");
	depthButton.onclick = function (){
		var setPoint = form.elements[0].value;
		io.emit("command", {type:"auto-depth", setPoint:setPoint});
		status.innerHTML = ("Auto depth on " + setPoint + "m");
		console.log("clicked auto depth");
		displayInScrollWindow({logType:"Autopilot depth", data:"Auto pilot depth activated setpoint: " + setPoint.toString() + " [m]."});
	}
	var off = document.getElementById("autoDepthOff");
	off.onclick = function(){
		status.innerHTML = ("Auto depth off");
		io.emit("command", {type:"auto-depth-off"});
		displayInScrollWindow({logType:"Autopilot depth", data:"Auto pilot depth off"});
	}
}

function handleHeadingAutopilotButton(){
	var form = document.getElementById("autoHeadingForm");
	var headingButton = document.getElementById("autoHeadingButton");
	var status = document.getElementById("autoHeadingPrint");
	headingButton.onclick = function(){
		var setPoint = form.elements[0].value;
		io.emit("command", {type:"auto-heading", setPoint:setPoint});
		status.innerHTML = ("Auto heading on " + setPoint + " deg");
		console.log("auto heading");
		displayInScrollWindow({logType:"Autopilot heading", data:"Auto pilot heading activated setpoint: " + setPoint.toString() + " [deg]."});
	}
	var off = document.getElementById("autoHeadingOff");
	off.onclick = function(){
		status.innerHTML = ("Auto heading off");
		displayInScrollWindow({logType:"Autpilot heading", data: "Auto pilot heading off"});
		io.emit("command", {type:"auto-heading-off"});
	}
}

function handleLightsToggle(){
	var form = document.getElementById("lightsForm");
	var lightsButton = document.getElementById("lightsButton");

	lightsButton.onclick = function(){
		var setPoint = form.elements[0].value;
		io.emit("command", {type:"set-lights", setPoint:setPoint});
		console.log("Setting lights, value is : " + setPoint);
	}
}

function handleLaserToggle(){
	var form = document.getElementById("laserForm");
	var laserButton = document.getElementById("laserButton");

	laserButton.onclick = function(){
		var setPoint = form.elements[0].value;
		io.emit("command", {type:"set-laser", setPoint:setPoint});
		console.log("Setting laser, value is : " + setPoint);
	}
}


function handleGainButton(){
	var form = document.getElementById("gainForm");
	var gainButton = document.getElementById("gainButton");
	gainButton.onclick = function(){
		var setPoint = form.elements[0].value;
		io.emit("command", {type:"set-gain", setPoint:setPoint});
		var gainElement = document.getElementById("gainValue");
		gainElement.innerHTML = ("Gain is : " + setPoint);
		displayInScrollWindow({logType:"Gain", data:"Setting gain [0,1]: " + setPoint});
	}
}


function displayMeasurement(data){

	if(data.deap){
			var depthValueElement = document.getElementById("depthValue");
			depthValueElement.innerHTML = ("Depth value is : "+ data.deap);
	}

	if(data.hdgd){
		var headingValueElement = document.getElementById("headingValue");
		headingValueElement.innerHTML = ("Heading value is : "+ data.hdgd);
	}
}

// ########################
//
// Handle touch screen control
//
// ########################

function makeTouchEventHandlers(){
	document.body.style.webkitTouchCallout='none'; // By default, a popup will appear to "save image" when pressing on image on tablet.

	handleTouch("forward", "pos", "surge", "port");
	handleTouch("backward", "neg", "surge", "port");
	handleTouch("rot_c", "pos", "yaw", "starboard");
	handleTouch("rot_cc", "neg", "yaw", "starboard");
	handleTouch("up", "neg", "heave", "vertical");
	handleTouch("down", "pos", "heave", "vertical");
}

function handleTouch(element, value, direction, thruster){
	var imageElement = document.getElementById(element);
	imageElement.addEventListener("touchstart", function(){
		if(inputMode == "default"){
			handleTouchStart(element, value, direction, thruster);
		}
	});
	imageElement.addEventListener("touchend", function(){
		handleTouchEnd(element, value, direction, thruster);
	});
	imageElement.addEventListener("touchcancel", function(){
		handleTouchEnd(element, value, direction, thruster);
	});
	imageElement.addEventListener("touchleave", function(){
		handleTouchEnd(element, value, direction, thruster);
	});
}



function handleTouchStart(element, val, dir, thruster){
	if(controlMode == "motion"){
		sendTouchPress(val, dir, "keydown");
	}
	else if (controlMode == "manual"){
		handleManualTouchPress(element, val, thruster, "keydown");
	}
}

function handleTouchEnd(element, val, dir, thruster){
	if(controlMode == "motion"){
		sendTouchPress(val, dir, "keyup");
	}else if(controlMode == "manual"){
		handleManualTouchPress(element, val, thruster, "keyup");
	}
}

function handleManualTouchPress(element, val, thruster, keypress){
	switch(element){
		case "rot_c":
			sendTouchPressManualControl("neg", thruster, keypress);
			break;
		case "rot_cc":
			sendTouchPressManualControl("pos", thruster, keypress);
			break;
		case "up":
			sendTouchPressManualControl("pos", thruster, keypress);
			break;
		case "down":
			sendTouchPressManualControl("neg", thruster, keypress);
			break;
		default:
			sendTouchPressManualControl(val, thruster, keypress);
			break;
	}
}

function sendTouchPress(val, dir, keyPress){
	var command = {type: "thrust-command", input: "default", controlmode: controlMode, val: val, keypress: keyPress, dir: dir};
	io.emit("command", command);
	displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: default (touch). controlmode (expected:motion):" +
				controlMode + ". Value:" + val + ". Keypress:" + keyPress + ". Direction:" + dir + "."});
}

function sendTouchPressManualControl(val, thruster, keyPress){
	var command = {type: "thrust-command", input: "default", controlmode: controlMode, val: val, keypress: keyPress, thruster: thruster};
	io.emit("command", command);
	displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: default (touch). controlmode (expected:manual):" +
				controlMode + ". Value:" + val + ". Keypress:" + keyPress + ". thruster:" + thruster + "."});
}






function initXBOXControllerHandler(){
	var gamepad = new Gamepad();

	gamepad.bind(Gamepad.Event.CONNECTED, function(device) {
        // a new gamepad connected
        console.log("connected new gamepad!");
    });

    gamepad.bind(Gamepad.Event.DISCONNECTED, function(device) {
        // gamepad disconnected
        console.log("gamepad disconnected");
    });

    gamepad.bind(Gamepad.Event.UNSUPPORTED, function(device) {
        // an unsupported gamepad connected (add new mapping)
    });

    gamepad.bind(Gamepad.Event.BUTTON_DOWN, function(e) {
        // e.control of gamepad e.gamepad pressed down
        console.log("button down. control: " + e.control);
        if(inputMode == "joystick"){
        	if(controlMode == "manual"){
        		handleShoulderButtons(e, 1);
        	}
        }
    });

    gamepad.bind(Gamepad.Event.BUTTON_UP, function(e) {
        // e.control of gamepad e.gamepad released
        console.log("button up. control : " + e.control);
        if(inputMode == "joystick"){
        	if(controlMode == "manual"){
        		handleShoulderButtons(e, 0);
        	}
        }
    });

    gamepad.bind(Gamepad.Event.AXIS_CHANGED, function(e) {
        // e.axis changed to value e.value for gamepad e.gamepad
        console.log("axis changed. axis: " + e.axis + ". value : " + e.value);
        if(inputMode == "joystick"){
        	checkIfInitialized(e);
        	if(e.value > epsilon || e.value < -epsilon){ // Avoid sending thrust commands when not using.
        		processStickInput(e);
        	}else{
        		checkPrevious(e, epsilon);
        	}
        	updateJoystickValues(e);
        }
	});

    gamepad.bind(Gamepad.Event.TICK, function(gamepads) {
        // gamepads were updated (around 60 times a second)
    });

    if (!gamepad.init()) {
        // Your browser does not support gamepads, get the latest Google Chrome or Firefox
        alert("Controller unsupported. Get latest Google Chrome of Firefox if you want to use gamepad input");

    }
}

function processStickInput(e){

	if(controlMode == "motion"){
		var dir;
		switch(e.axis){
			case "RIGHT_STICK_X":
				dir = "yaw";
				sendJoystickCommandMotion(e.value, dir);
				break;
			case "RIGHT_STICK_Y":
				dir = "surge";
				sendJoystickCommandMotion(-e.value, dir); // Y axis is positive downwards.
				break;
			case "LEFT_STICK_Y":
				dir = "heave";
				sendJoystickCommandMotion(e.value, dir); // Y axis is positive downwards and heave is positive down.
				break;
			default:
				return;
		}
		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: joystick. controlmode (expected:motion):" +
				controlMode + ". Value:" + e.value + ". Direction:" + dir + "."});

	}else if(controlMode == "manual"){
		var thruster;
		switch(e.axis){
			case "RIGHT_STICK_Y":
				thruster = "starboard";
				sendJoystickCommandManual(-e.value, thruster); // Y axis is positive downwards.
				break;
			case "LEFT_STICK_Y":
				thruster = "port";
				sendJoystickCommandManual(-e.value, thruster);
				break;
			case "LEFT_BOTTOM_SHOULDER":
				thruster = "vertical";
				sendJoystickCommandManual(-e.value, thruster);
				break;
			case "RIGHT_BOTTOM_SHOULDER":
				thruster = "vertical";
				sendJoystickCommandManual(e.value, thruster);
				break;
			default:
				return;
		}

		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: joystick. controlmode (expected:manual):" +
				controlMode + ". Value:" + e.value + ". Thruster:" + thruster + "."});
	}
}

function sendJoystickCommandManual(value, thruster){
	var command = {type: "thrust-command", input: "joystick", controlmode: controlMode, val: value, thruster: thruster};
	io.emit("command", command);
}

function sendJoystickCommandMotion(value, dir){
	var command = {type: "thrust-command", input: "joystick", controlmode: controlMode, val: value, dir: dir};
	io.emit("command", command);
}

function updateJoystickValues(e){
	switch(e.axis){
		case "RIGHT_STICK_X":
			joystickValue.RIGHT_STICK_X = e.value;
			break;
		case "RIGHT_STICK_Y":
			joystickValue.RIGHT_STICK_Y = e.value;
			break;
		case "LEFT_STICK_Y":
			joystickValue.LEFT_STICK_Y = e.value;
			break;
		default:
			return;
	}
}

function checkPrevious(e, epsilon){
	var previous;
	switch(e.axis){
		case "RIGHT_STICK_X":
			previous = joystickValue.RIGHT_STICK_X;
			break;
		case "RIGHT_STICK_Y":
			previous = joystickValue.RIGHT_STICK_Y;
			break;
		case "LEFT_STICK_Y":
			previous = joystickValue.LEFT_STICK_Y;
			break;
		default:
			return;
	}
	if(previous > epsilon || previous < -epsilon){
		var command = {axis: e.axis, value: 0};
		processStickInput(command);
	}
}

function checkIfInitialized(e){
	switch(e.axis){
		case "RIGHT_STICK_X":
			if(joystickValue.RIGHT_STICK_X == 2){
				joystickValue.RIGHT_STICK_X = e.value;
			}
			break;
		case "RIGHT_STICK_Y":
			if(joystickValue.RIGHT_STICK_Y == 2){
				joystickValue.RIGHT_STICK_Y = e.value;
			}
			break;
		case "LEFT_STICK_Y":
			if(joystickValue.LEFT_STICK_Y == 2){
				joystickValue.LEFT_STICK_Y = e.value;
			}
			break;
		default:
			return;
	}
}

function handleShoulderButtons(e, keydown){
	if(e.control == "LEFT_BOTTOM_SHOULDER"){
		var command = {type: "thrust-command", input: "joystick", controlmode: controlMode, val: -1*keydown, thruster: "vertical"};
		io.emit("command", command);
		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: joystick. controlmode (expected:manual):"
			+ controlMode + ". Value:" + (-1*keydown).toString() + ". Thruster: starboard"});
		console.log("left shoulder, keydown:" + keydown)
	}
	else if(e.control == "RIGHT_BOTTOM_SHOULDER"){
		var command = {type: "thrust-command", input: "joystick", controlmode: controlMode, val: 1*keydown, thruster: "vertical"};
		io.emit("command", command);
		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: joystick. controlmode (expected:manual):"
			+ controlMode + ". Value:" + (keydown).toString() + ". Thruster: starboard"});
	}
}


// ########################
//
// Handle keyboard input
//
// ########################


function initKeyPressHandler(){
	var validKeys = [65, 68, 69, 81, 83, 87];

	// make table and store values of key presses
	// if key up is triggered, check it is already triggered
	// if window is blurred, clear table
	$("body").on("keydown keyup", function(keyPressedEvent){
		if(inputMode == "default"){
			var keyNumber = keyPressedEvent.which;
			var eventType = keyPressedEvent.type;
			if($.inArray(keyNumber, validKeys) > -1){
				if(eventType == "keyup"){
					keysPressed[$.inArray(keyNumber, validKeys)] = false;
					handleKeyPress(keyNumber, eventType);
				}
				else if(keysPressed[$.inArray(keyNumber, validKeys)] === false){
					keysPressed[$.inArray(keyNumber, validKeys)] = true;
					handleKeyPress(keyNumber, eventType);
				}
			}
		}
	});
}





function handleKeyPress(keyValue, pressType){
	var value;
	if(controlMode == "motion"){
		var direction;
		switch(keyValue){
			case 65:
				direction = "yaw";
				value = "neg";
				break;
			case 68:
				direction = "yaw";
				value = "pos";
				break;
			case 69:
				direction = "heave";
				value = "neg";
				break;
			case 81:
				direction = "heave";
				value = "pos";
				break;
			case 83:
				direction = "surge";
				value = "neg";
				break;
			case 87:
				direction = "surge";
				value = "pos";
				break;
			default:
				console.log("error in client - handlekeypress");
				break;
		}

		var command = {type: "thrust-command", input: "default", controlmode: controlMode, val: value, keypress: pressType, dir: direction};
		io.emit("command", command);
		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: default (keyboard). controlmode (expected:motion):"
			+ controlMode  + ". Value: " + value + ". Keypress: " + pressType + ". Direction:" + direction});

	}else if(controlMode == "manual"){
		var thruster;
		switch(keyValue){
			case 65:
				thruster = "port";
				value = "neg";
				break;
			case 68:
				thruster = "starboard";
				value = "neg";
				break;
			case 69:
				thruster = "starboard";
				value = "pos";
				break;
			case 81:
				thruster = "port";
				value = "pos";
				break;
			case 83:
				thruster = "vertical";
				value = "neg";
				break;
			case 87:
				thruster = "vertical";
				value = "pos";
				break;
			default:
				console.log("error in client - handlekeypress");
				break;
		}

		var command = {type: "thrust-command", input: "default", controlmode: controlMode, val: value, keypress: pressType, thruster: thruster};
		io.emit("command", command);
		displayInScrollWindow({logType:"Thrust command (client)", data:"Thrust command from client. Input: default (keyboard). controlmode (expected:manual):"
			+ controlMode  + ". Value: " + value + ". Keypress: " + pressType + ". Thruster:" + thruster});
	}
}





// For graphing from IO





function initDevModeToggle(){
	var button = document.getElementById("toggleDevMode");
	button.onclick = function(){
		if(displayDevMode){
			$("#devModeContainer").hide();

		}else{
			$("#devModeContainer").show();
		}
		displayDevMode = !displayDevMode;
	}
}



function initIOHandle(){
	io.on("msg", function(data){
		switch(data.type){
			case "measurement":
				displayMeasurement(data.content);
				saveMeasurements(data.content);
				break;
			case "command":
				saveCommand(data.content);
				break;
			case "estimated-states":
				// placeholder
				break;
			case "sim-measurement":
				saveSimulatedStates(data.content);
				break;
			case "log":
				displayInScrollWindow(data.content);
				break;
		}
	});
}



// ########################
//
// Initialize
//
// ########################




function handleVideo(){

	io.on("started", function(){
		var videoElement = document.getElementById('sourcevid');
		var adress = "http://192.168.0.12:3031/?action=stream";
		videoElement.setAttribute("src", adress);

		var videoContainer = document.getElementById("container");
		videoContainer.style.MozTransform = "rotate(270deg)";
		videoContainer.style.WebkitTransform ="rotate(270deg)";
		videoContainer.style.oTransform = "rotate(270deg)";
		videoContainer.style.transform = "rotate(270deg)";
		videoContainer.style.msTransform = "rotate(270deg)";
	});
}

function initTransferOfControl(){
	var requestButton = document.getElementById("requestControl");
	requestButton.onclick = function(){
		io.emit("requesting-control");
		displayInScrollWindow({logType:"Transfer of control", data: "[Transfer of control] Requesting control."});
	}

	io.on("requesting-control", function(data){
		if(confirm("Do you want to give control to machine with IP : " + data)){
			io.emit("giving-control");
			displayInScrollWindow({logType:"Transfer of control", data: "[Transfer of control] Giving control."});
		}else{
			displayInScrollWindow({logType:"Transfer of control", data: "[Transfer of control] Denied request for control."});
		}
	});

	io.on("gotcontrol", function(){
		alert("you have control");
		displayInScrollWindow({logType:"Transfer of control", data: "[Transfer of control] Recieved control."});
	});
}

function initInputHandlers(){
	makeTouchEventHandlers();
	initKeyPressHandler();
	handleLightsToggle();
	handleLaserToggle();
	handleGainButton();
	initXBOXControllerHandler();
	handleControlModeChange();
	handleInputModeChange();
	handleRunModeChange();
	document.onblur = function(){
		keysPressed = [false, false, false, false, false, false];
		io.emit("command", {type:"stop"});
		displayInScrollWindow({logType:"Stop", data:"Got unblur. Stopping."});
	};
	console.log("initialized!");
}



function initDevMode(){
	initDevModeToggle();
	initIOHandle();

	initScrollPane();
	initGraphs();
}


window.onload = function(){
	handleDepthAutopilotButton();
	handleHeadingAutopilotButton();
	handleVideo();
	initInputHandlers();
	initDevMode();
	initTransferOfControl();

	io.emit('clientloaded');

	initialized = 1;
};

io = io.connect();

// Send the ready event.
io.emit('clientconnected'); 	// Det er denne som triggerer routen i server.
