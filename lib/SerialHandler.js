
// require 
// constants
	var crc = require("crc");
	var StatusReader = require("./StatusReader");
	var serialport = require("serialport");
	var path = require("path");
	var spawn = require("child_process").spawn;

var SerialHandler = function(){
	
	var reader = new StatusReader();	
	var navigation;
	var baudrate = 115200;
	var serialPath = '/dev/ttyO1';
	var serialConnected = false;
	//var simulator = sim;
	var simulatorActive = false;

	

	this.setNavigation = function(nav){
		navigation = nav;
	};

	
	this.toggleSimulator = function(turnOn){
		simulatorActive = turnOn;
	};

	// from OpenROVController



	var location = path.join(__dirname, '..', './linux');
	console.log('Starting the script from ' + location + ' to setup UART1...');
	var setuart_process = spawn('sudo', [path.join(location, 'setuart.sh')]);
	setuart_process.on('error', function (err) {
		console.log('Error while starting the UART1 setup scipt!\nThe error was: ' + err);
	});



	// from Hardware. Set up connection. 
	var connection = new serialport.SerialPort(serialPath, {
		baudrate: baudrate,
		parser: serialport.parsers.readline('\r\n')
	});

	// Define input and output

	connection.on('open', function () {
		serialConnected = true;
		console.log('Serial port open');
    });

    connection.on('close', function (data) {
		console.log('!Serial port closed');
		serialConnected = false;
    });

    connection.on('data', function (data) {
		if(!simulatorActive){
			var sensordata = reader.parseStatus(data);
			navigation.updateStates(sensordata);
		}
    });
    
	/*	
	// Writing a command 
	var timesent = new Date();
	this.write = function (command) {
		console.log(command);
		var crc8 = crc.crc81wire(command);
		var commandBuffer = new Buffer(command,'utf8');
		var crcBuffer = new Buffer(1);
		crcBuffer[0]=crc8;
		//console.log(crcBuffer[0] + ":" + crc8.toString(16));
		//console.log(command);

		var messagebuffer = Buffer.concat([crcBuffer,commandBuffer]);
		// console.log(messagebuffer.toString('hex'));
		if (serialConnected) {
			var currenttime = new Date();
			var delay = 3-((currenttime.getTime() - timesent.getTime()));
			if (delay < 0) delay = 0;
			timesent = currenttime;
			timesent.setMilliseconds(timesent.getMilliseconds + delay);
	    	
	    	setTimeout(function(){
			console.log("writing to arduino : " + messagebuffer.toString('utf8'));
	    		connection.write(messagebuffer);
			
	    		if (emitRawSerialData)  hardware.emit('serial-sent', command);
			
	    	}, delay);
			
	    } else {
	    	console.log('DID NOT SEND');
	    }
	};
	*/

	
	this.write = function(command){
		if(simulatorActive){
			// simulator.update(command);
		}else{
			connection.write(command);
			// console.log("sending command to arduino (no buffer) : " + command);	
		}
		
	};

	// closing the connection 
	
	this.close = function () {
		serialConnected = false;
	    //This code is a work around for a race condition in the serial port code https://github.com/voodootikigod/node-serialport/issues/241#issuecomment-43058353
		var sp = connection;
		connection.flush(function(err) {
		setTimeout(function() {
			sp.close(function(err){});
			}, 10);
		});
	};
};

module.exports = SerialHandler;
