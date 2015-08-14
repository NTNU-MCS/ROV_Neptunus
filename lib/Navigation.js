

var Navigation = function(emitter){

	var control;
	var statusEmitter = emitter;
	var states;
	var date = new Date;
	var fs = require('fs');
	var path = 'data/sensordata: '+ date + '.txt';
	var depth = [];
	var roll = [];
	var pitch = [];
	var heading = [];
	var current = [];
	var voltage = []
	var temp = [];
	var values = [];

	this.setControl = function(con){
		control = con;
	};

	this.updateStates = function(sensorOutput){

		// update states - do estimation here.

		states = cleanData(sensorOutput);
		statusEmitter.emit("toClient", {type:"measurement", content:states});

	};

	this.updateSimulatedStates = function(states){
		statusEmitter.emit("toClient",  {type:"sim-measurement", content:states});
	}

	// Emit Estimated states when Kalman filter or observer is implemented


	function cleanData(states){

		var ut = new Object();
		if(isRealSignal(states.deap)){
			writetofile(states.deap, "depth");

			depth.push(parseFloat(states.deap));
			if(!smallFilter(depth)){
				return ut;
			}

			ut.deap=states.deap;
			return ut;
		} else if(isRealSignal(states.roll)){
			writetofile(states.roll, "roll");

			roll.push(parseFloat(states.roll));
			if(!smallFilter(roll)){
				return ut;
			}

			if(states.roll<0){
				ut.roll=360+parseFloat(states.roll);
			}
			else{
				ut.roll=states.roll;
			}
			return ut;
		} else if(isRealSignal(states.pitc)){
			writetofile(states.pitc, "pitch");

			pitch.push(parseFloat(states.pitc));
			if(!smallFilter(pitch)){
				return ut;
			}

			ut.pitc=states.pitc;
			return ut;
		} else if(isRealSignal(states.hdgd)){
			writetofile(states.hdgd, "heading");

			heading.push(parseFloat(states.hdgd));
			if(!smallFilter(heading)){
				return ut;
			}

			ut.hdgd=states.hdgd;
			return ut;
		} else if(isRealSignal(states.iout)){
			writetofile(states.iout, "current");

			current.push(parseFloat(states.iout));
			if(!smallFilter(current)){
				return ut;
			}

			ut.iout=states.iout;
			return ut;
		} else if(isRealSignal(states.vout)){
			writetofile(states.vout, "voltage");

			voltage.push(parseFloat(states.vout));
			if(!smallFilter(voltage)){
				return ut;
			}

			ut.vout=states.vout;
			return ut;
		} else if(isRealSignal(states.temp)){
			writetofile(states.temp, "temp");

			temp.push(parseFloat(states.temp));
			if(!smallFilter(temp)){
				return ut;
			}

			ut.temp=states.temp;
			return ut;
		}else {
			return ut;
		}
	}

	function smallFilter(arr){
		if(arr.length < 6){
			return true;
		}
		values = arr.slice(arr.length-6, arr.length-2);
		values.sort();
		if(arr[arr.length-1] > (values[3]+0.1) || arr[arr.length-1] < (values[1]-0.1)){
			return false;
		}
		return true;
	}

//Checks if it is a number with two desimals but not three or more.
	function isRealSignal(state){

		var regexp = /\d(?=(\.\d{2}))/;
		var regexp2 = /\d(?=(\.\d{3}))/;
		if(!isNaN(state)){
			if (((state.toString()).search(regexp)!=-1) && (state.toString()).search(regexp2) == -1){
				return true;
			}
		}
		return false;
	}

	function writetofile(states,type){
		date = new Date;
	  fs.appendFile(path, date + ": " + type + ": " + states.toString() + "\n", function(err) {
	      if (err) throw 'error writing file: ' + err;
		});
	}


};

module.exports = Navigation;
