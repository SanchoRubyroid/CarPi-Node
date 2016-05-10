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
  var name = vehicle_to_remove.getName()
  vehicle_to_remove.cleanUp()
  vehicles.splice(vehicles.indexOf(vehicle_to_remove, 1))

  //console.log('['+ name +'] removed')
}

exports.captureVehicle = function(vehicle_name, control_socket) {
  var vehicle = getVehicleByName(vehicle_name)

  if(vehicle.isCaptured())
    throw new Error('Unexpected! Vehicle has already been captured.')

  //console.log('['+ vehicle.getName() +'] captured')

  vehicle.setControlSocket(control_socket)
  vehicle.sendData(new Buffer([103,0,0])) // Request video stream
}

exports.releaseVehicle = function(control_socket) {
  var vehicle = getVehicleByControlSocketID(control_socket.id)
  if(vehicle) vehicle.release()
}

exports.controlVehicle = function(control_socket, data) {
  var vehicle = getVehicleByControlSocketID(control_socket.id)
  vehicle.sendData(data)
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

exports.getControlSocket = function(vehicle_name) {
  var vehicle = getVehicleByName(vehicle_name.toString().replace(Vehicle.namePattern, ''))
  return vehicle.getControlSocket()
}

setVehicleName = function(data, socket) {
  var vehicle_name = data.toString().replace(Vehicle.namePattern, '')
  console.log('Vehicle name: ' + vehicle_name)
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

getVehicleByName = function(name) {
  return vehicles.find(function(vehicle){
    return vehicle.getName() == name
  })
}
