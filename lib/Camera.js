var fs = require('fs');
var spawn = require("child_process").spawn;

var Camera = function() {
	var process;

	var cmd = "mjpg_streamer"; // path til mjpg streamer
	var videoDevicePath = "/dev/video0";
	var inputPath = "/usr/local/lib/input_uvc.so";
	var outputPath = "/usr/local/lib/output_http.so";
	var resolution = "800x600";
	var framerate = 20;
	var portNr = 3031;
	var mjpgStreamerArgs = [
		'-i',		// input
		inputPath + " -r " + resolution + " -f " + framerate,
		'-o',		// output
		outputPath + " -p " + portNr
	];
	var isCapturing = false;



	this.capture = function(){
		 fs.exists(videoDevicePath, function(exists){
			if(!exists){
				console.log("Could not find camera");
				return;
			}
			isCapturing = true;
			process = spawn(cmd, mjpgStreamerArgs);
			console.log("started camera");

			process.stdout.on("data", function(data){
				console.log("Got data:" + data);
			});

			process.stderr.on('data', function (data) {
        		console.log('camera error with data: ' + data);
      		});

			process.on('exit', function(code){
				console.log("Process exited with code : " + code);
				isCapturing = false;
			});


		});
	};



	this.isCapturing = function (){
		return isCapturing;
	};

	return this;
};

module.exports = Camera;
