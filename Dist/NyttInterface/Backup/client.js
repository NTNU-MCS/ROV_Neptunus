var inputMode = "joystick"; // {"default", "joystick", "oculus"}. default is keyboard or touchpad.
var controlMode = "motion"; // {"motion", "manual", "DP", "Lever"}
var runMode = "normal"; // {"normal", "simulation"};
var keysPressed = [false, false, false, false, false, false];
var joystickValue = {RIGHT_STICK_X: 2, RIGHT_STICK_Y: 2, LEFT_STICK_Y: 2};
var initialized = 0;
var displayDevMode = true;
var epsilon = 0.1;


// ########################
//
// Handle x-box-control input
//
// ########################



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

function displayInScrollWindow(command){
	return;
	//if($.inArray(command.logType, scrollPaneContent) > -1){
	//	addToScrollPane(command.data);
	//}
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

// ########################
//
// Handle display
//
// ########################

function displayMeasurement(data){
	if(data.pitc){
		var pitch = Number(data.pitc);
			updateNeptunusPitch(pitch);

	}

	if(data.roll){
		var roll = Number(data.roll);
			updateNeptunusRoll(roll);

	}

	if(data.deap){
		var depth = Number(data.deap);
			handleDepthValue(depth);

	}

	if(data.hdgd){
			var heading = Number(data.hdgd);
			handleHeadingValue(heading);
			updateComass3DModel(heading);
	}
}

function initIOHandle(){
	io.on("msg", function(data){
		switch(data.type){
			case "measurement":
				displayMeasurement(data.content);
				//saveMeasurements(data.content);
				break;
			case "command":
				//saveCommand(data.content);
				break;
			case "estimated-states":
				// placeholder
				break;
			case "sim-measurement":
				//saveSimulatedStates(data.content);
				break;
			case "log":
				//displayInScrollWindow(data.content);
				break;
		}
	});
}

function handleVideo(){

		var videoElement = document.getElementById('videostream');
		var adress = "http://192.168.0.12:3031/?action=stream";
		videoElement.setAttribute("src", adress);

		var videoContainer = document.getElementById("container");
/*
		if(videoElement && videoElement.style) {
			videoElement.style.MozTransform = "rotate(270deg)";
			videoElement.style.WebkitTransform ="rotate(270deg)";
			videoElement.style.oTransform = "rotate(270deg)";
			videoElement.style.transform = "rotate(270deg)";
			videoElement.style.msTransform = "rotate(270deg)";
//			videoContainer.style.height = window.innerWidth/100*90;
//			videoContainer.style.width = window.innerHeight/100*90;
		}
*/
}

function setUpWindow(){
	setUp_animation_window();
	setUp_heading_window();
	setUp_depth_window();
}

function setUp_animation_window(){
	$(".animation_model").css("top", (window.innerHeight/100*10));
	$(".animation_model").css("left", (window.innerWidth-(window.innerWidth/100*10)-(window.innerHeight/2)));
	$(".animation_model").css("height", (window.innerHeight/2) + "px");
	$(".animation_model").css("width", (window.innerHeight/2) + "px");
}

function setUp_heading_window(){
	$(".heading_box").css("top", (window.innerHeight/100*10));
	$(".heading_box").css("left", (window.innerWidth/100*15));
	$(".heading_box").css("height", (window.innerHeight/100*10) + "px");
	$(".heading_box").css("width", (window.innerWidth/2) + "px");
	$(".heading_arrow_up").css("top", (window.innerHeight/100*10) + 40  );
	$(".heading_arrow_up").css("left", (window.innerWidth/100*15) + (window.innerWidth/2)/2 - 32/2 );
	$(".heading_arrow_down").css("top", (window.innerHeight/100*10) - 32 );
	$(".heading_arrow_down").css("left", (window.innerWidth/100*15) + (window.innerWidth/2)/2 - 32/2 );
}

function setUp_depth_window(){
	$(".depth_box").css("top", (window.innerHeight/100*22));
	$(".depth_box").css("left", (window.innerWidth/100*8));
	$(".depth_box").css("height", (window.innerHeight/100*50) + "px");
	$(".depth_box").css("width", (window.innerHeight/100*10) + "px");
	$(".depth_arrow_rigth").css("top", (window.innerHeight/100*22) + (window.innerHeight/100*50)/2 -32/2 );
	$(".depth_arrow_rigth").css("left", ((window.innerWidth/100*8)-32));
	$(".depth_arrow_left").css("top", (window.innerHeight/100*22) + (window.innerHeight/100*50)/2 -32/2 );
	$(".depth_arrow_left").css("left", ((window.innerWidth/100*8) + (window.innerHeight/100*10)));
}

function handleDepthValue(depth){
	//if(data.deap){
		var depth_presize = ((depth % 1));
		if (!(depth_presize<0.5)) {
			depth_presize-=1;
		}
		document.getElementById("depth_1").innerHTML = ((Math.round(depth-3)).toString());
		document.getElementById("depth_2").innerHTML = ((Math.round(depth-2)).toString());
		document.getElementById("depth_3").innerHTML = ((Math.round(depth-1)).toString());
		document.getElementById("depth_4").innerHTML = ((Math.round(depth)).toString());
		document.getElementById("depth_5").innerHTML = ((Math.round(depth+1)).toString());
		document.getElementById("depth_6").innerHTML = ((Math.round(depth+2)).toString());
		document.getElementById("depth_7").innerHTML = ((Math.round(depth+3)).toString());
		$(".depth_1").css("font-size", 6 - 8*(depth_presize));
		$(".depth_2").css("font-size", 14 - 6*(depth_presize));
		$(".depth_3").css("font-size", 20 - 12*(depth_presize));
		$(".depth_4").css("font-size", 32 - 12*Math.abs(depth_presize));
		$(".depth_5").css("font-size", 20 + 12*(depth_presize));
		$(".depth_6").css("font-size", 14 + 6*(depth_presize));
		$(".depth_7").css("font-size", 6 + 8*(depth_presize));
	//}
}

function handleHeadingValue(heading){
	var headingRound = Math.round(heading/5)*5;
	var heading_presize = (((heading + 2.5) % 5) - 2.5)/2.5;
	writeHeading("heading_1", (headingRound - 25), 6 - 6*heading_presize);
	writeHeading("heading_2", (headingRound - 20), 12 - 3*heading_presize);
	writeHeading("heading_3", (headingRound - 15), 18 - 3*heading_presize);
	writeHeading("heading_4", (headingRound - 10), 24 - 3*heading_presize);
	writeHeading("heading_5", (headingRound - 5), 30 - 3*heading_presize);
	writeHeading("heading_6", (headingRound), 36 - 3*Math.abs(heading_presize));
	writeHeading("heading_7", (headingRound + 5), 30 + 3*heading_presize);
	writeHeading("heading_8", (headingRound + 10), 24 + 3*heading_presize);
	writeHeading("heading_9", (headingRound + 15), 18 + 3*heading_presize);
	writeHeading("heading_10", (headingRound + 20), 12 + 3*heading_presize);
	writeHeading("heading_11", (headingRound + 25), 6 + 6*heading_presize);
}

function writeHeading(headingElementID, number, font_size){
	var string_H = new String;
	if(number > 360){
		number -= 360;
	}
	else if(number < 0){
		number += 360;
	}
	string_H=string_H.concat(number.toString());
	document.getElementById(headingElementID).innerHTML = string_H;
	$("."+headingElementID).css("width", font_size*2.5 + "px");
	$("."+headingElementID).css("font-size", font_size);
}

function initTransferOfControl(){

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
	//makeTouchEventHandlers();
	initKeyPressHandler();
	//handleLightsToggle();
	//handleLaserToggle();
	//handleGainButton();
	initXBOXControllerHandler();
	//handleControlModeChange();
	//handleInputModeChange();
	//handleRunModeChange();
	document.onblur = function(){
		keysPressed = [false, false, false, false, false, false];
		io.emit("command", {type:"stop"});
		displayInScrollWindow({logType:"Stop", data:"Got unblur. Stopping."});
	};
	console.log("initialized!");
}



window.onload = function(){
	//handleDepthAutopilotButton();
	//handleHeadingAutopilotButton();
	handleAnimation();
	handleVideo();
	setUpWindow();
	initInputHandlers();
	//initDevMode();
	//initTransferOfControl();
	initIOHandle();
	handleHeadingValue(0);
	handleDepthValue(0);

	io.emit('clientloaded');

	initialized = 1;
};

io = io.connect();

// Send the ready event.
io.emit('clientconnected'); 	// Det er denne som triggerer routen i server.