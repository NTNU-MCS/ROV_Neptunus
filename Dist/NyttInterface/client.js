/*
client.js controlls everything in the HMI
All the positions and sizes of the elements are set,
the controlls are done, the buttons controlls...
*/

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


//display in HMI
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

//handle data from neptunus
function initIOHandle(){
	io.on("msg", function(data){
		switch(data.type){
			case "measurement":
				displayMeasurement(data.content);
				saveMeasurements(data.content);
				break;
			case "command":
				saveCommand(data.content);
				displayThrustInfo(data.content);
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

//handle vidoestream
function handleVideo(){

		var videoElement = document.getElementById('videostream');
		var videoContainer = document.getElementById('video_container')

		var adress = "http://192.168.0.12:3031/?action=stream";
		videoElement.setAttribute("src", adress);

		videoContainer.style.height = window.innerHeight;
		videoContainer.style.width = window.innerWidth;

		if(videoElement && videoElement.style){

			videoElement.style.width = window.innerHeight;
			videoElement.style.height = window.innerWidth;

			//videoElement.style.MozTransform = "rotate(270deg)";
			//videoElement.style.WebkitTransform ="rotate(270deg)";
			//videoElement.style.oTransform = "rotate(270deg)";
			//videoElement.style.transform = "rotate(270deg)";
			//videoElement.style.msTransform = "rotate(270deg)";
		}
}

//load the window
function setUpWindow(){
	setUp_animation_window();
	setUp_heading_window();
	setUp_depth_window();
	setUp_bottom_window();
	setUp_top_bar();
}

//display thust
function displayThrustInfo(content){
	document.getElementById('Port_thrust').innerHTML=("Port: " + - Math.round((content.thr1-1500)/5) + "%");
	document.getElementById('Strb_thrust').innerHTML=("Strb: " + Math.round((content.thr3-1500)/5) + "%");
	document.getElementById('Heave_thrust').innerHTML=("Heave: " + Math.round((content.thr2-1500)/5) + "%");
}

//Loading top bar
function setUp_top_bar(){
	$(".top-bar").css("width", (window.innerWidth) + "px");
	document.getElementById('lights_info').style.background='#000000'
}

//Load bottom bar
function setUp_bottom_window(){
	$(".bottom_box").css("top", (window.innerHeight-40));
	$(".bottom_box").css("left", (window.innerWidth/100*5));
	$(".bottom_box").css("width", (window.innerWidth/100*88) + "px");
	$(".bottom_inni").css("width", (window.innerWidth/100*88) + "px");
	$(".bottom_box").css("height", 40 + "px");
	$("button").css("height", (40) + "px");

	//not implemented
	//document.getElementById("pressure_button").style.background='#00FF00'
	//document.getElementById("dvl_button").style.background='#00FF00'
	//document.getElementById("imu_button").style.background='#00FF00'

	document.getElementById('lights_button').style.background='#000000'
	hide_show();
	dev_page();
}

//Hide/show the dev_page
function dev_page(){
	//$(".devModeContainer").css("width", (window.innerWidth) + "px");
	//$(".devModeContainer").css("width", (window.innerWidth) + "px");

	$("#devModeContainer").hide();
	document.getElementById('dev_page_button').onclick=function(){
		$("#devModeContainer").show()
	}
	document.getElementById('return_button').onclick=function(){
		$("#devModeContainer").hide()
	}
}

//Loading the animation window
function setUp_animation_window(){
	$(".animation_model").css("top", (window.innerHeight/100*10));
	$(".animation_model").css("left", (window.innerWidth-(window.innerWidth/100*10)-(window.innerHeight/2)));
	$(".animation_model").css("height", (window.innerHeight/2) + "px");
	$(".animation_model").css("width", (window.innerHeight/2) + "px");
}

//Loading the heading window
function setUp_heading_window(){
	$(".heading_box").css("top", (window.innerHeight/100*10) + 45);
	$(".heading_box").css("left", (window.innerWidth/100*15));
	$(".heading_box").css("height", (window.innerHeight/100*10) + "px");
	$(".heading_box").css("width", (window.innerWidth/2) + "px");
	$(".heading_arrow_up").css("top", (window.innerHeight/100*10) + 40 + 45);
	$(".heading_arrow_up").css("left", (window.innerWidth/100*15) + (window.innerWidth/2)/2 - 32/2 );
	$(".heading_arrow_down").css("top", (window.innerHeight/100*10) - 32 + 45);
	$(".heading_arrow_down").css("left", (window.innerWidth/100*15) + (window.innerWidth/2)/2 - 32/2 );
}

//Loading the depth window
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

//hide/show buttons
function hide_show(){
	var hide_panels=false;
	var hide_info=false;
	document.getElementById('hide_show_panels').onclick=function(){
		if(hide_panels){
			$("#animation_model").show()
			$("#top-bar").show()
			document.getElementById('hide_show_panels').innerHTML=("Hide Panels");
			hide_panels=false;
		}
		else{
			$("#animation_model").hide()
			$("#top-bar").hide()
			document.getElementById('hide_show_panels').innerHTML=("Show Panels");
			hide_panels=true;
		}
	}
	document.getElementById('hide_show_info').onclick=function(){
		if(hide_info){
			$("#heading_box").show()
			$("#depth_box").show()
			$("#depth_arrow_rigth").show()
			$("#depth_arrow_left").show()
			$("#heading_arrow_up").show()
			$("#heading_arrow_down").show()
			$("#Thruster_info").show()
			document.getElementById('hide_show_info').innerHTML=("Hide Info");
			hide_info=false;
		}
		else{
			$("#heading_box").hide()
			$("#depth_box").hide()
			$("#depth_arrow_rigth").hide()
			$("#depth_arrow_left").hide()
			$("#heading_arrow_up").hide()
			$("#heading_arrow_down").hide()
			$("#Thruster_info").hide()
			document.getElementById('hide_show_info').innerHTML=("Show Info");
			hide_info=true;
		}
	}

}

//Handle the buttons on the bottom bar
function handle_bottom_window(){

	var lights = "off";
	document.getElementById('lights_button').onclick=function(){
		if(lights=="off"){
			document.getElementById('lights_info').innerHTML=("Light ON");
			document.getElementById('lights_button').innerHTML=("Light ON");
			document.getElementById('lights_button').style.background='#FFCC00'
			document.getElementById('lights_info').style.background='#FFCC00'
			lights = "on";
			io.emit("command", {type:"set-lights", setPoint:250});
			console.log("Setting lights, value is : " + 250);
		}
		else if(lights=="on"){
			document.getElementById('lights_info').innerHTML=("Light OFF");
			document.getElementById('lights_button').innerHTML=("Light OFF");
			document.getElementById('lights_button').style.background='#000000'
			document.getElementById('lights_info').style.background='#000000'
			lights = "off";
			io.emit("command", {type:"set-lights", setPoint:0});
			console.log("Setting lights, value is : " + 0);
		}
	};

	document.getElementById('controlMode_selecter').onchange = function(){
		inputMode = controlMode_selecter.value;
		io.emit("command", {type:"stop"});
		displayInScrollWindow({logType:"Stop", data: "Input mode changed. Stopping."});
		console.log(controlMode_selecter.value);
		document.getElementById('controlMode_info').innerHTML=("Control Mode: " + controlMode_selecter.value);
	}

	//not implemented, placeholder

	/*
	var pressure="on";
	document.getElementById('pressure_button').onclick=function(){
		if(pressure=="on"){
			document.getElementById('pressure_button').innerHTML=("Pressure OFF");
			document.getElementById("pressure_button").style.background='#FF0000'
			pressure="off";
		}
		else if(pressure="off"){
			document.getElementById('pressure_button').innerHTML=("Pressure ON");
			document.getElementById("pressure_button").style.background='#00FF00'
			pressure="on";
		}
	}

	var dvl="on";
	document.getElementById('dvl_button').onclick=function(){
		if(dvl=="on"){
			document.getElementById('dvl_button').innerHTML=("DVL OFF");
			document.getElementById("dvl_button").style.background='#FF0000'
			dvl="off";
		}
		else if(dvl="off"){
			document.getElementById('dvl_button').innerHTML=("DVL ON");
			document.getElementById("dvl_button").style.background='#00FF00'
			dvl="on";
		}
	}

	var imu="on";
	document.getElementById('imu_button').onclick=function(){
		if(imu=="on"){
			document.getElementById('imu_button').innerHTML=("IMU OFF");
			document.getElementById("imu_button").style.background='#FF0000'
			imu="off";
		}
		else if(imu="off"){
			document.getElementById('imu_button').innerHTML=("IMU ON");
			document.getElementById("imu_button").style.background='#00FF00'
			imu="on";
		}
	}
	*/
}

//Handle the Thust window
function handleThust_info(){
	$(".Thruster_info").css("top", (window.innerHeight/100*15));
	$(".Thruster_info").css("left", (window.innerWidth-(window.innerWidth/100*10)));
	$(".Thruster_info").css("width", (window.innerWidth/100*10));
}

//Handle depth Value change, "rotating" the depth "wheel"
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

//Handle heading value change, "rotating" the heading "wheel"
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

//fuction called from handleHeadingValue that writes the heading value
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

//handle the bottom box dissapering
function handle_bottom_box_dissapering(){
	$(function(){
		var hided = false;
		//$(".bottom_inni").hide();
		$("div.bottom_box").mouseover(function() {
			if(hided){
				$("#bottom_inni").show("scale");
				hided=false;
			setTimeout(function() {
		    $("#bottom_inni").hide("scale");
		 	 	hided = true;
			}, 15000 );
		}
		});
		setTimeout(function() {
			$("#bottom_inni").hide("scale");
			hided = true;
		}, 15000 );
	});
}

/* Not implemented
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
*/

function initInputHandlers(){
	initKeyPressHandler();
	initXBOXControllerHandler();
	//handleControlModeChange();
	document.onblur = function(){
		keysPressed = [false, false, false, false, false, false];
		io.emit("command", {type:"stop"});
		displayInScrollWindow({logType:"Stop", data:"Got unblur. Stopping."});
	};
	console.log("initialized!");
}

function initDevMode(){
		initIOHandle();
		initScrollPane();
		initGraphs();
	}

window.onload = function(){
	handleAnimation();
	handleVideo();
	setUpWindow();
	handle_bottom_window();
	handleThust_info();
	handle_bottom_box_dissapering();
	initInputHandlers();
	initDevMode();
	initIOHandle();
	handleHeadingValue(0);
	handleDepthValue(0);

	io.emit('clientloaded');

	initialized = 1;
};

io = io.connect();

// Send the ready event.
io.emit('clientconnected'); 	// Det er denne som triggerer routen i server.
