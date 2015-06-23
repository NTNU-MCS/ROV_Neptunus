var spawn = require("child_process").spawn;

// require
// constants

var Control = function(serialH, eventEmitter, sim){

	// Thruster input range = {1000, 2000}, with 1500 being zero speed.


	var MAX_THRUST = 1;
	var MIN_THRUST = -1;
	var MIN_THRUSTEROUTPUTSPEED = 1000;
	var MAX_THRUSTEROUTPUTSPEED = 2000;

	var statusEmitter = eventEmitter;
	var simulator = sim;
	var gain = 1;	// {0, 1}
	var navigation;
	var serialHandler = serialH;
	var laserOn = false;
	var controlMode = "motion";
	var simulatorActive = false;


	var thruster1Speed;
	var thruster2Speed;
	var thruster3Speed;

	var surge = 0;  // {-1, 1}
	var yaw = 0;
	var heave = 0;

	this.setNavigation = function(nav){
		navigation = nav;
	};

	this.setGain = function(request){
		var value = request.setPoint;
		if(value >= 0 && value <= 1){
			gain = value;
		}
	};

	this.getGain = function(){
		return gain;
	};

	this.toggleSimulator = function(turnOn){
		simulatorActive = turnOn;
	}

	this.DP = function(){
		// Placeholder.
		// Implemenet DP functionality here.
	};

	this.autopilotHeading = function(setpoint, willActivate){

	};


	this.autopilotDepth = function(setpoint, willActivate){

	};

	this.stop = function(){
		surge = 0;
		yaw = 0;
		heave = 0;
		thruster1Speed = 1500;
		thruster2Speed = 1500;
		thruster3Speed = 1500;

		orderCommand();
	};

	this.processCommand = function(command){

		controlMode = command.controlmode;

		console.log("Processing command. Input:" + command.input + ". controlmode:" + command.controlmode + ". Value:" + command.val +
			". dir:" + command.dir + ". Thruster: " + command.thruster);


		if(command.input == "joystick"){
			processJoystickCommand(command);
		}else if(command.input == "default"){
			processRegularCommand(command);
		}else{
			console.log("Error in Control. Unexpected input");
		}

		orderCommand();
	};



	function processJoystickCommand(command){
		setThrust(1, command.val, command);
	}

	function processRegularCommand(command){

		var keydown;
		if(command.keypress == "keyup"){
			keydown = 0;
		}else if(command.keypress == "keydown"){
			keydown = 1;
		}else{
			console.log("Error in control. Unexpected data type");
		}

		var value;
		if(command.val == "pos"){
			value = 1;
		}else if(command.val == "neg"){
			value = -1;
		}else{
			console.log("error in Control. Unexpected command value");
		}

		setThrust(keydown, value, command);
	}

	function setThrust(keydown, value, command){
		if(controlMode == "motion"){
			switch(command.dir){
				case "surge":
					surge = gain*keydown*value;
					break;
				case "yaw":
					yaw = gain*keydown*value;
					break;
				case "heave":
					heave = gain*keydown*value;
					break;
			}
			doThrustAllocation();

		}else if(controlMode == "manual"){
			switch(command.thruster){
				case "port":
					thruster1Speed = mapThrusterSpeed(gain*keydown*value);
					break;
				case "vertical":
					thruster2Speed = mapThrusterSpeed(gain*keydown*value);
					break;
				case "starboard":
					thruster3Speed = mapThrusterSpeed(gain*keydown*value);
					break;
			}
		}else{
			console.log("Error in control. Unexpected control mode");
		}
	}

	function orderCommand(){

		makeCorrectionToPortThruster();
		logAction();

		if(simulatorActive){
			simulator.updateThrust({surge:surge, heave:heave, yaw:yaw});
		}else{
			serialHandler.write("go(" + thruster1Speed.toString() + ", " +  thruster2Speed.toString() + ", " + thruster3Speed.toString() + ", 0);");
		}
	}

	function logAction(){
		console.log("Ordering thrust {surge, yaw, heave} : {" + surge + ", " + yaw + ", " + heave + "}");
		console.log("Ordering thrust {thr1, thr2, thr3}: {" + thruster1Speed + ", " + thruster2Speed + ", " + thruster3Speed + "}");
		console.log("Control mode is : " + controlMode);

		var cmd = {thr1: thruster1Speed, thr2: thruster2Speed, thr3: thruster3Speed, surge: surge, yaw: yaw, heave: heave};
		var log = {logType:"Thrust command (to motors)", data:"Port thruster:" + cmd.thr1 + ". Vertical thruster:" + cmd.thr2 +
					 ". Starboard thruster:" + cmd.thr3 + ". Surge:" + surge + ". Yaw:" + yaw + ". Heave:" + heave + "."};
		statusEmitter.emit("toClient", {type:"command", content:cmd});
		statusEmitter.emit("toClient", {type:"log", content:log});
	}

	function makeCorrectionToPortThruster(){
		// Thruster 1 (port) has reversed direction e.i. the command {1750, 1750, 1750}
		// will give positive lateral and starboard thrust, but negative port thrust.

		var average = (MAX_THRUSTEROUTPUTSPEED + MIN_THRUSTEROUTPUTSPEED) * 0.5;
		thruster1Speed = 2*average - thruster1Speed;
	}

	function doThrustAllocation(){
		thruster1Speed = mapThrusterSpeed(limit(surge + yaw));
		thruster2Speed = mapThrusterSpeed(heave);
		thruster3Speed = mapThrusterSpeed(limit(surge - yaw));
	}

	function mapThrusterSpeed(input){
		return  (input - MIN_THRUST) * (MAX_THRUSTEROUTPUTSPEED - MIN_THRUSTEROUTPUTSPEED) / (MAX_THRUST - MIN_THRUST) + MIN_THRUSTEROUTPUTSPEED;
	}

	function limit(input){
		if(input > MAX_THRUST){
			return MAX_THRUST;
		}else if(input < MIN_THRUST){
			return MIN_THRUST;
		}
		return input;
	}

	this.toggleLights = function(request){
		if(simulatorActive){
			return;
		}
		var value = request.setPoint;
		if(value >= 0 && value <= 255){
			serialHandler.write("ligt(" + value.toString() + ")");
			console.log("Turning lights on value : " + value);
		}
		else if(value > 255){
			serialHandler.write("ligt(255)");
			console.log("Turning lights on value : 255");
		}
		else{
			serialHandler.write("ligt(0)");
			console.log("Turning lights off");
		}
		orderCommand(); // The command to toggle lights doesnt get executed before another command is sendt (why...?!). This line is simply
						// to get lights command to get executed immidiatly.
	};

	this.toggleLaser = function(request){
		if(simulatorActive){
			return;
		}
		var value = request.setPoint;
		if(value >= 0 && value <= 255){
			serialHandler.write("claser(" + value.toString() + ")");
			console.log("Turning laser on to value : " + value);
		}
		else{
			serialHandler.write("claser(0)");
			console.log("Turning laser off");
		}
		orderCommand();
	};
};

module.exports = Control;
