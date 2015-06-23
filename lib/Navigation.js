

var Navigation = function(emitter){

	var control;
	var statusEmitter = emitter;
	var states;
	var fs = require('fs');
	var path = 'test2.txt',
	buffer_w = new Buffer(500);
	//var stream_w = fs.createWriteStream("my_file.txt");
	//stream_w.once('open', function(fd)

	this.setControl = function(con){
		control = con;
	};

	this.updateStates = function(sensorOutput){

		// update states - do estimation here.

		states = sensorOutput;
		//writetofile(states);
		console.log(states);
		statusEmitter.emit("toClient", {type:"measurement", content:states});
	};

	this.updateSimulatedStates = function(states){
		statusEmitter.emit("toClient",  {type:"sim-measurement", content:states});
	}

	// Emit Estimated states when Kalman filter or observer is implemented

	function writetofile(states){
		buffer_w.write(states.toString());

		fs.open(path, 'w', function(err, fd) {
		    if (err) {
		        throw 'error opening file: ' + err;
		    }

		    fs.write(fd, buffer_w, 0, buffer_w.length, null, function(err) {
		        if (err) throw 'error writing file: ' + err;
		        fs.close(fd, function() {})
		    });
		});
	}


};

module.exports = Navigation;
