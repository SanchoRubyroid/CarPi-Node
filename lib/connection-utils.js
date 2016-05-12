var io = require('socket.io')(3001);
var net  = require('net');
var yaml = require('js-yaml');
var fs   = require('fs');
var randomstring = require("randomstring");

var vehicleManager = require('./vehicle-manager.js');
var StreamProcessor = require('./stream-processor.js');

var config = yaml.safeLoad(fs.readFileSync('config.yml'));

exports.initializeBrowserListConnection = function() {
  io.of('/list').on('connection', function (socket) {
    reloadBrowserVehiclesList(socket)
  })
}

exports.initializeBrowserControlConnection = function() {
  io.of('/control').on('connection', function (socket) {
    socket.on('capture', (vehicle_name) => {
      vehicleManager.captureVehicle(vehicle_name, socket)
      reloadBrowserVehiclesList()
    })

    socket.on('disconnect', () => {
      vehicleManager.releaseVehicle(socket)
      reloadBrowserVehiclesList()
    })

    socket.on('car-control', (data) => {
      vehicleManager.controlVehicle(socket, new Buffer(data))
    })
  })
}

exports.initializeVehiclesServer = function() {
  var vehicles_server = net.createServer(function(socket) {
    console.log('Vehicle connected')
    socket.id = randomstring.generate()
    vehicleManager.addVehicle(socket)

    socket.on('close', () => {
      vehicleManager.removeVehicle(socket)
      reloadBrowserVehiclesList()
      console.log('Vehicle socket closed')
    })

    // Vehicle speaks
    socket.on('data', (data) => {
      after_parse_action = vehicleManager.parseVehicleData(socket, data)

      if(after_parse_action == vehicleManager.REFRESH_CARS_LIST_ACTION)
        reloadBrowserVehiclesList()
    });
  });

  vehicles_server.listen(config['port'], config['host']);
}

exports.initializeVideoStreamServer = function() {
  var stream_server = net.createServer(function(socket) {
    console.log('Video stream connected')

    socket.id = randomstring.generate()
    var streamProcessor = new StreamProcessor(io, socket)

    socket.on('data', (data) => {
      if(!streamProcessor.isBind())
        streamProcessor.bind(vehicleManager.getControlSocket(data))
      else
        streamProcessor.inputData(data)
    });

    socket.on('close', () => {
      console.log("Video stream socket closed")
      streamProcessor.cleanUp()
    });

    socket.on('error', (err) => {
      console.log("ERROR: " + err)
    })
  });

  stream_server.listen(parseInt(config['port'])+1, config['host']);
}

reloadBrowserVehiclesList = function(target) {
  if(!target) target = io.of('/list')
  target.emit('cars-list', vehicleManager.getVehiclesList())
}
