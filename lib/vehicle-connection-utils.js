var net  = require('net');
var yaml = require('js-yaml');
var fs   = require('fs');

var vehicles_sockets = []
var vehicles_server = null;
var config = yaml.safeLoad(fs.readFileSync('config.yml'));

vehicleNames = function() {
  var vehicle_names = []
  var captured_vehicle_names = []

  vehicles_sockets.forEach(function(vehicles_socket){
    if(vehicles_socket.captured)
      captured_vehicle_names.push(vehicles_socket.vehicle_name)
    else
      vehicle_names.push(vehicles_socket.vehicle_name)
  })

  return [vehicle_names, captured_vehicle_names]
}

getVehicleSocketByName = function(vehicle_name) {
  return vehicles_sockets.find(function(socket){
    return socket.vehicle_name === vehicle_name
  })
}

exports.initializeVehiclesServer = function(io) {
  vehicles_server = net.createServer(function(socket) {
    vehicles_sockets.push(socket)

    socket.on('end', () => {
      vehicles_sockets.splice(vehicles_sockets.indexOf(socket.vehicle_name),1)
      io.of('/list').emit('cars-list', vehicleNames());
    });

    socket.on('data', (data) => {
      var vehicle_name_pattern = /^vn:/

      if(vehicle_name_pattern.test(data)) {
        var vehicle_name = data.toString().replace(vehicle_name_pattern, '')
        socket.vehicle_name = vehicle_name
        io.of('/list').emit('cars-list', vehicleNames());
        socket.pause()
      }
    });

    // socket.write('Echo server\r\n');
    // socket.pipe(socket);
  });

  vehicles_server.listen(config['port'], config['host']);
}

exports.captureVehicleSocket = function(vehicle_name) {
  getVehicleSocketByName(vehicle_name).captured = true
}

exports.releaseVehicleSocket = function(vehicle_name) {
  getVehicleSocketByName(vehicle_name).captured = false
}

exports.captured = function(vehicle_name) {
  return getVehicleSocketByName(vehicle_name).captured
}

exports.vehicleNames = vehicleNames
exports.getVehicleSocketByName = getVehicleSocketByName
