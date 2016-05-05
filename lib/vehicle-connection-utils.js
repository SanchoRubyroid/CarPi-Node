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

ping = function(socket) {
  socket.pong_received = false
  if(socket.writable)
    socket.write(new Buffer([102, 0, 0]))

  setTimeout(function() {
    if(!socket.pong_received) {
      socket.destroy()
    } else if(socket.writable) {
      setTimeout(function(){ ping(socket) }, 4000)
    }
  }, 1000)
}

exports.initializeVehiclesServer = function(io) {
  vehicles_server = net.createServer(function(socket) {
    vehicles_sockets.push(socket)

    ping(socket)

    socket.on('close', () => {
      vehicles_sockets.splice(vehicles_sockets.indexOf(socket.vehicle_name),1)
      io.of('/list').emit('cars-list', vehicleNames());
    })

    socket.on('data', (data) => {
      var vehicle_name_pattern = /^vn:/

      if(vehicle_name_pattern.test(data)) {
        var vehicle_name = data.toString().replace(vehicle_name_pattern, '')
        socket.vehicle_name = vehicle_name
        io.of('/list').emit('cars-list', vehicleNames());
        //socket.pause()
      } else if(data === 'pong') {
        socket.pong_received = true
      }
    });
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
