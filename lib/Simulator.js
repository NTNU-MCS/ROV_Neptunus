var math = require("mathjs");

var Simulator = function(nav){

	var tau = math.matrix([[0], [0], [0], [0]]);
	var eta = math.matrix([[0], [0], [0], [0]]);
	var nu = math.matrix([[0], [0], [0], [0]]);

	var g = math.matrix([[0], [0], [0.0234], [0]]);
	var M = math.matrix([[5.515, 0, 0, 0], [0, 18.0633, 0, -0.8926], [0, 0, 5.7895, 0], [0, -0.8926, 0, 0.5488]]);
	

	var invM = math.inv(M);

	var dt = 0.01;
	var measurementUpdateTime = 1000;

	var navigation = nav;
	var active = false;

	var thrustConstant = 12; // Each thruster generates about 12N
	var length = 0.045; // 0.045 meter from x axis to the thrusters.
	var yawFactor = 2*length;




	setInterval(function(){
		if(active){
			sendOutput();
		}
	}, measurementUpdateTime);

	setInterval(function(){
		if(active){
			update();
		}
	}, dt);




	this.updateThrust = function(thrust){
		tau = [[thrust.surge*thrustConstant], [0], [thrust.heave*thrustConstant], [thrust.yaw*thrustConstant*yawFactor]];
	}

	this.toggleSimulator = function(turnOn){
		active = turnOn;
	};


	function sendOutput(){

		var phi = math.subset(eta, math.index(3,0)) % (2*math.pi);

		var state = {x:eta.subset(math.index(0,0)),
					 y:math.subset(eta, math.index(1,0)),
					 z:math.subset(eta, math.index(2,0)),
					 phi:phi,
					 u:math.subset(nu, math.index(0,0)),
					 w:math.subset(nu, math.index(2,0)),
					 r:math.subset(nu, math.index(3,0))
		};
		navigation.updateSimulatedStates(state);
		//console.log("nu: " + nu);
		//console.log("eta" + eta);
	}

	function update(){
		var yaw = math.subset(eta, math.index(3,0));
		var etaD = math.multiply(etaDot(yaw), dt);
		var nd = math.multiply(nuDot(), dt);

		eta = math.add(eta, etaD);
		nu = math.add(nu, nd);

	}



	function etaDot(yaw){

		// this was written a bit hastely. Should be using subset as shown in newCol in testMath().

		var u = math.subset(nu, math.index(0,0));
		var v = math.subset(nu, math.index(1,0));
		var w = math.subset(nu, math.index(2,0));
		var r = math.subset(nu, math.index(3,0));

		var velocity = [[u], [v], [w]];
		var pDot = math.multiply(rotZ(yaw), velocity);

		var res = math.matrix([[math.subset(pDot, math.index(0, 0))], [math.subset(pDot, math.index(1, 0))], [math.subset(pDot, math.index(2, 0))], [r]]);

		return res;
	}

	function rotZ(yaw){
		return [[math.cos(yaw), -math.sin(yaw), 0], [math.sin(yaw), math.cos(yaw), 0], [0, 0, 1]];
	}

	function nuDot(){
		var d = math.add(getRestoringForces(), getDampning()); // add getCoreolis() if C is included
		var res = math.subtract(tau, d);
		return math.multiply(invM, res);
	}

	function getCoreolis(){ // returns C(v)*v.
		// C(v) can be generated from the m2c from GNC toolbox by Fossen.
		var coreolis = math.matrix([[0], [0], [0], [0]]);
		return coreolis;
	}


	function getDampning(){ // returns D(v)*v
		var u = math.subset(nu, math.index(0,0));
		var v = math.subset(nu, math.index(1,0));
		var w = math.subset(nu, math.index(2,0));
		var r = math.subset(nu, math.index(3,0));

		var D = math.matrix([[4.008*math.abs(u), 0, 0, 0], [0, 35.216*math.abs(v), 0, 0], [0, 0, 10.304*math.abs(w), 0], [0, 0, 0, 0.32*math.abs(r)]]);
		//console.log("dampning: " + math.multiply(D, nu));

		return math.multiply(D, nu);
	}

	function getRestoringForces(){
		return g;
	}

	function testMath(){
		var row = math.matrix([1, 2, 3]);
		var col = math.matrix([[4],[5],[6]]);
		var squareMat = math.eye(3);
		console.log("Printing rowVector: " + row);
		console.log("Printing colVector: " + col);
		console.log("Printing math.transpose(rowVector): " + math.transpose(row));
		console.log("Printing 3x3 identity matrix: " + squareMat);
		console.log("Printing 3x3 identity matrix multiplied by col vector: " + math.multiply(squareMat, col));

		var newCol = math.subset(col, math.index([0, 2], 0));
		console.log("newcol: " + newCol);
		console.log("newcol * 0.1 = " + math.multiply(newCol, 0.1));
	}


};

module.exports = Simulator;
