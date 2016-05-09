var Vehicle = require('./vehicle.js');

var vehicles = []

var REFRESH_CARS_LIST_ACTION = 'refresh-cars-list'
exports.REFRESH_CARS_LIST_ACTION = REFRESH_CARS_LIST_ACTION

exports.getVehiclesList = function() {
  var vehicle_names = []
  var captured_vehicle_names = []

  vehicles.forEach(function(vehicle){
    if(vehicle.isCaptured())
      captured_vehicle_names.push(vehicle.getName())
    else
      vehicle_names.push(vehicle.getName())
  })

  return [vehicle_names, captured_vehicle_names]
}

exports.addVehicle = function(socket) {
  vehicles.push(new Vehicle(socket))
}

exports.removeVehicle = function(socket) {
  var vehicle_to_remove = getVehicleBySocketID(socket.id)
  vehicle_to_remove.cleanUp()
  vehicles.splice(vehicles.indexOf(vehicle_to_remove, 1))
}

exports.captureVehicle = function(vehicle_name, control_socket) {
  var vehicle = getVehicleByName(vehicle_name)

  if(vehicle.isCaptured())
    throw new Error('Unexpected! Vehicle has already been captured.')

  vehicle.setControlSocket(control_socket)
  vehicle.send(new Buffer([103,0,0])) // Request video stream
}

exports.releaseVehicle = function(control_socket) {
  var vehicle = getVehicleByControlSocketID(control_socket.id)
  vehicle.release()
}

exports.controlVehicle = function(control_socket, data) {
  var vehicle = getVehicleByControlSocketID(control_socket.id)
  vehicle.send(data)
}

exports.parseVehicleData = function(socket, data) {
  var after_parse_action = null

  if(Vehicle.namePattern.test(data)) {
    setVehicleName(data, socket)
    after_parse_action = REFRESH_CARS_LIST_ACTION
  } else if(data == 'pong') {
    getVehicleBySocketID(socket.id).pong()
  }

  return after_parse_action
}

exports.setVehicleVideoSocket = function(video_socket, vehicle_name) {
  var vehicle = getVehicleByName(vehicle_name.toString().replace(Vehicle.namePattern, ''))
  vehicle.initializeVideoSocket(video_socket)
}

exports.processVideoData = function(video_socket, data) {
  var video_socket_id = video_socket.id
  var vehicle = getVehicleByVideoSocketID(video_socket_id)
  vehicle.videoData(data)
}

setVehicleName = function(data, socket) {
  var vehicle_name = data.toString().replace(Vehicle.namePattern, '')
  var vehicle = getVehicleBySocketID(socket.id)
  vehicle.setName(vehicle_name)
}

getVehicleBySocketID = function(socket_id) {
  return vehicles.find(function(vehicle){
    return vehicle.getSocketID() == socket_id
  })
}

getVehicleByControlSocketID = function(socket_id) {
  return vehicles.find(function(vehicle){
    return vehicle.getControlSocketID() == socket_id
  })
}

getVehicleByVideoSocketID = function(socket_id) {
  return vehicles.find(function(vehicle){
    return vehicle.getVideoSocketID() == socket_id
  })
}

getVehicleByName = function(name) {
  return vehicles.find(function(vehicle){
    return vehicle.getName() == name
  })
}
