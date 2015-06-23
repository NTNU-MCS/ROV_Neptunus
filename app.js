var express = require('express.io');
var http = require('http');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes');
var app = require('express.io')(); // express();
//var users = require('./routes/user'); // trengs ikke
var EventEmitter = require('events').EventEmitter

var Camera = require("./lib/Camera");
var Navigation = require("./lib/Navigation");
var Control = require("./lib/Control");
var SerialHandler = require("./lib/SerialHandler");
var Simulator = require("./lib/Simulator");



app.http().io();
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'Dist'))); // her settes "client"

//app.get('/index', routes.index);
//app.get('/users', users.list); // trengs ikke
                               // (./routes/user.js kan sikkert også fjernes)



var controlRoom = "controlRoom";
var masterIP = "192.168.0.11";
var masterRequest;

var camera = new Camera();
var statusEmitter = new EventEmitter();
var serialHandler = new SerialHandler();
var navigation = new Navigation(statusEmitter);
var simulator = new Simulator(navigation);
var control = new Control(serialHandler, statusEmitter, simulator);


navigation.setControl(control);
control.setNavigation(navigation);
serialHandler.setNavigation(navigation);



statusEmitter.on("toClient", function(data){
    app.io.broadcast("msg", data);
});



function isInControl(ip){
    if(ip != masterIP){
        console.log("Got request from someone else than master. Denying.");
    }
    return ip == masterIP;
}

function initVideoStream(){
    console.log("initializing video");
    if(!camera.isCapturing()){
        camera.capture();
    }else{
        console.log("Camera did not start, already capturing");
    }
    app.io.broadcast("started");
}

app.io.on("connection", function(socket){
    var ip = socket.handshake.address.address;
    socket.on("disconnect", function(){
        if(ip == masterIP){
            console.log("Master Client disconnected with ip : " + ip + " stopping");
            control.stop();
        }
    });
});

app.io.on("disconnect", function(){
    console.log("disc");
});

app.io.route('clientconnected', function(req) {
    console.log("New client");
    initVideoStream();
    if(req.handshake.address.address == masterIP){
        req.io.join(controlRoom);
    }
    console.log("initialized!");
});

app.io.route('clientloaded', function(req){
    console.log("Client loaded");
    // initVideoStream();
});


app.io.route("requesting-control", function(req){
    var requestIP = req.handshake.address.address;
    if(requestIP != masterIP){
        masterRequest = req;
        app.io.room(controlRoom).broadcast("requesting-control", requestIP);
        console.log("IP : " + requestIP + " is requesting control.");
    }else{
        console.log("IP : " + requestIP + " is requesting control, but already has it.");
    }
});

app.io.route("giving-control", function(req){
    req.io.leave(controlRoom);
    masterIP = masterRequest.handshake.address.address;
    masterRequest.io.join(controlRoom);
    app.io.room(controlRoom).broadcast("gotcontrol");
    console.log("Giving control to IP: " + masterIP);
});



app.io.route("command", function(req){
    requestIP = req.handshake.address.address;
    if(isInControl(requestIP)){
        switch(req.data.type){
            case "thrust-command":
                control.processCommand(req.data);
                break;
            case "stop":
                control.stop();
                break;
            case "runmode-normal":
                control.toggleSimulator(false);
                serialHandler.toggleSimulator(false);
                simulator.toggleSimulator(false);
                break;
            case "runmode-simulation":
                control.toggleSimulator(true);
                serialHandler.toggleSimulator(true);
                simulator.toggleSimulator(true);
                break;
            case "set-gain":
                control.setGain(req.data);
                break;
            case "set-lights":
                control.toggleLights(req.data);
                break;
            case "set-laser":
                control.toggleLaser(req.data);
                break;
            case "auto-heading":
                control.autopilotHeading(req.data, true);
                break;
            case "auto-depth":
                control.autopilotDepth(req.data, true);
                break;
            case "auto-heading-off":
                control.autopilotHeading(0, false);
                break;
            case "auto-depth-off":
                control.autopilotDepth(0, false);
                break;
            case "dp":
                control.DP();
                break;
        }
    }
});




module.exports = app;
app.listen(3037);
console.log("server running on port 3037");
