

var Navigation = function(emitter){
	
	var control;
	var statusEmitter = emitter;
	var states;

	this.setControl = function(con){
		control = con;
	};

	

	this.updateStates = function(sensorOutput){

		// update states - do estimation here. 

		states = sensorOutput;
		statusEmitter.emit("toClient", {type:"measurement", content:states});	
	};

	this.updateSimulatedStates = function(states){
		statusEmitter.emit("toClient",  {type:"sim-measurement", content:states});
	}

	
	

	// Emit Estimated states when Kalman filter or observer is implemented
	
};

module.exports = Navigation;
