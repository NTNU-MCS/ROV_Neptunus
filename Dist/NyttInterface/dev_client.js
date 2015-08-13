// Dev mode interface


var depth = [];
var heading = [];
var roll = [];
var pitch = [];
var voltage = [];
var current = [];
var motor = [];

var thr1cmd = [];
var thr2cmd = [];
var thr3cmd = [];
var surge = [];
var yaw = [];
var heave = [];

var estDepth = [];
var estRoll = [];
var estPitch = [];
var estHeading = [];

var simX = [];
var simY = [];
var simDepth = [];
var simHeading = [];

var simU = [];
var simW = [];
var simR = [];

var simulatedEta = [simX, simY, simDepth, simHeading];
var simulatedNu = [simU, simW, simR]; // v is always zero, so not included.
var measurements = [depth, roll, pitch, heading, voltage, current];
var commands = [thr1cmd, thr2cmd, thr3cmd, surge, yaw, heave];
var estStates = [estDepth, estRoll, estPitch, estHeading];
var graphs = [];

// For scroll pane

var scrollPaneChoices = ["Gain", "Thrust command (client)", "Thrust command (to motors)", "Transfer of control", "Autopilot depth",
						"Autopilot heading", "Stop"];
var scrollPaneContent = [];
var api;
var pane;

//

document.getElementById('return_button').onclick=function(){
  window.close();
}


function saveMeasurements(data){

	save(data.deap, depth, "depth");
	save(data.roll, roll, "degrees");
	save(data.pitc, pitch, "degrees");
	save(data.hdgd, heading, "degrees");
	save(data.vout, voltage, "voltage");
	save(data.iout, current, "current");
}

function saveCommand(command){
	var date = new Date();

	thr1cmd.push({x:date, y:command.thr1});
	thr2cmd.push({x:date, y:command.thr2});
	thr3cmd.push({x:date, y:command.thr3});

	surge.push({x:date, y:command.surge});
	yaw.push({x:date, y:command.yaw});
	heave.push({x:date, y:command.heave});
}

function saveSimulatedStates(states){
	var date = new Date();

	console.log("phi is : " + states.phi);
	console.log("phi to string: " + states.phi.toString());
	simX.push({x:date, y:states.x});
	simY.push({x:date, y:states.y});
	simDepth.push({x:date, y:states.z});
	simHeading.push({x:date, y:states.phi});
	simU.push({x:date, y:states.u});
	simW.push({x:date, y:states.w});
	simR.push({x:date, y:states.r});
}

function save(value, location, checkType){
	if(!isNaN(parseFloat(value/1))){
		var val = parseFloat(value/1);
		var date = new Date();
		switch(checkType){
			case "degrees":
				if(val > 360 || val < 0){
					//console.log("Got angle bigger than 360 or less than 0. Not saving");
					return;
				}
				break;
			case "current":
				if(val > 4 || val < 0.001){
					//console.log("Got current value negative or bigger than 4A. Not saving");
					return;
				}
				break;
			case "voltage":
				if(val > 13 || val < 10){
					//console.log("Got voltage < 10 or bigger than 13. Not saving");
					return;
				}
				break;
			case "depth":
				if(val > 200 || val < -10){
					//console.log("Got depth less than -10 or bigger than 200. Not saving");
					return;
				}
				break;
		}
		location.push({x:date, y:val});
	}
}

function setChartsRefresh(){
	setInterval(function(){
		for(var i = 0; i < graphs.length; i++){
			graphs[i].render();
		}
	}, 1000);
}


function makeGraph(datapoints, title, cont){
	var container = "chartContainer" + (graphs.length+1).toString();

	var chart = new CanvasJS.Chart(container, {
		title : {text : title},
		zoomEnabled: true,
		axisX:{valueFormatString: "m:ss"},
		data :
			[{
				type: "line",
				markerType: "circle",
				dataPoints: datapoints
			}]
	});
	chart.render();
	console.log("creating chart");
	return chart;
}


function makeGraphDropDownHandlers(){
	addDropdown("measurementDropdown", measurements);
	addDropdown("commandsDropdown", commands);
	addDropdown("etaDropdown", simulatedEta);
	addDropdown("nuDropdown", simulatedNu);
	// addDropdown("estimatedStatesDropdown", estStates, estStateNames);
	$("#estimatedStatesDropdown").prop('selectedIndex', -1); // This can be removed if the above line is added.
}



function addDropdown(element, dataVector){
	$("#" + element).prop('selectedIndex', -1);
	var dropDown = document.getElementById(element);
	dropDown.onchange = function(){
		if(graphs.length >= 10){
			console.log("Max number of charts reached.");
			return;
		}
		graphs.push(makeGraph(dataVector[dropDown.selectedIndex], dropDown[dropDown.selectedIndex].text));
	}
}



function initDeleteGraphsButton(){
	var graphbutton = document.getElementById("deleteGraphs");
	graphbutton.onclick = function(event){
		event.preventDefault();	// http://stackoverflow.com/questions/18947432/why-is-client-disconnecting-and-reconnecting-in-node-express-socket-io-jad
		for(var i = 1; i <= graphs.length; i++){
			var container = "chartContainer" + i.toString();
			$("#" + container.toString()).html(""); // deleting the reference to the chart held by the container.
		}
		graphs = [];
	};
}



function initResetGraphsButton(){
	var resetButton = document.getElementById("resetGraphs");
	resetButton.onclick = function(){
		clearData();
	};
}

function initGraphs(){
	setChartsRefresh();
	makeGraphDropDownHandlers();
	initDeleteGraphsButton();
	initResetGraphsButton();
}

/// Scroll pane


function initScrollPane(){
	pane = $('.scroll-pane');
	pane.jScrollPane();  			// pass settings to jScrollPane() if needed.
	api = pane.data("jsp");
	populateLogDropdown();
	makeLogDropdownEventHandlers();
}


function addToScrollPane(content){
	var date = new Date();
	var printOut = "[" + date.getMinutes() + ":" + date.getSeconds() + "] " + content;
	if(initialized == "1"){
		api.getContentPane().append(
				$('<p />').text(printOut)
		);
	api.reinitialise();
	}
}




function displayInScrollWindow(command){
	if($.inArray(command.logType, scrollPaneContent) > -1){
		addToScrollPane(command.data);
	}
}

function populateLogDropdown(){
	for(var i = 0; i < scrollPaneChoices.length; i++){
		$("#scrollPaneContentDropdown").append("<option>" + scrollPaneChoices[i] + "</option>");
		$("#scrollPaneRemoveDropdown").append("<option>" + scrollPaneChoices[i] + "</option>");
	}
	$("#scrollPaneContentDropdown").prop('selectedIndex', -1);
	$("#scrollPaneRemoveDropdown").prop('selectedIndex', -1);
}

function makeLogDropdownEventHandlers(){
	var dropdown = document.getElementById("scrollPaneContentDropdown");
	dropdown.onchange = function(){
		var element = dropdown.options[dropdown.selectedIndex].text;
		scrollPaneContent.push(element);
		$("#scrollPaneContent").append("<li>" + element + "</li>");
	}

	var removeDropdown = document.getElementById("scrollPaneRemoveDropdown");
	removeDropdown.onchange = function(){
		var element = removeDropdown.options[removeDropdown.selectedIndex].text;
		var index = $.inArray(element, scrollPaneContent);
		if(index > -1){
			scrollPaneContent.splice(index, 1);
			$("#scrollPaneContent").children().each(function(){
				if($(this).text() == element){
					$(this).remove();
				}
			});
		}
	};
}

function clearData(){ // arr = [] will delete references to the array. arr.length = 0 does not.
	depth.length = 0;
	heading.length = 0;
	roll.length = 0;
	pitch.length = 0;
	voltage.length = 0;
	current.length = 0;
	motor.length = 0;

	thr1cmd.length = 0;
	thr2cmd.length = 0;
	thr3cmd.length = 0;
	surge.length = 0;
	yaw.length = 0;
	heave.length = 0;

	estDepth.length = 0;
	estRoll.length = 0;
	estPitch.length = 0;
	estHeading.length = 0;

	simX.length = 0;
	simY.length = 0;
	simDepth.length = 0;
	simHeading.length = 0;

	simU.length = 0;
	simW.length = 0;
	simR.length = 0;
}

function initIOHandle(){
	io.on("msg", function(data){
		switch(data.type){
			case "measurement":
				//displayMeasurement(data.content);
				saveMeasurements(data.content);
				break;
			case "command":
				saveCommand(data.content);
				//displayThrustInfo(data.content);
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

window.onload = function(){

	initIOHandle();

	initScrollPane();
	initGraphs();
}
