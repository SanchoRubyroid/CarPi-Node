var method = Vehicle.prototype;

function Vehicle(socket) {
  this._socket = socket
  this._control_socket = undefined
  this._name = null

  this.pingPeriodicDelayed()
}

Vehicle.namePattern = /^vn:/

method.pingPeriodic = function() {
  var instance = this
  var socket = this._socket
  socket.pong_received = false
  this.sendData(new Buffer([102, 0, 0]))

  setTimeout(function() {
    if(!socket.pong_received)
      socket.destroy()
    else if(socket.writable)
      instance.pingPeriodicDelayed()
  }, 1000)
}

method.pingPeriodicDelayed = function() {
  var instance = this
  setTimeout(function(){ instance.pingPeriodic() }, 4000)
}

method.pong = function() {
  this._socket.pong_received = true
}

method.sendData = function(data){
  if(this._socket.writable)
    this._socket.write(data)
}

method.getName = function() {
  if(!this._name) throw new Error('Unexpected! Vehicle name was not set.')
  return this._name
}

method.getSocketID = function() {
  return this._socket.id
}

method.getControlSocket = function() {
  return this._control_socket
}

method.getControlSocketID = function() {
  if(!this._control_socket) throw new Error('Unexpected! Vehicle is not controlled.')
  return this._control_socket.id
}

method.setName = function(name) {
  if(this._name) throw new Error('Unexpected! Vehicle name has already been set.')
  this._name = name
}

method.setControlSocket = function(socket) {
  this._control_socket = socket
}

method.isCaptured = function() {
  return this._control_socket != undefined
}

method.release = function() {
  this.sendData(new Buffer([105, 0, 0])) // release command
  this._control_socket = undefined
  //console.log('['+ this._name +'] released')
}

method.cleanUp = function() {
  this.release()
  //this._stopPing = true
  this._name = null
}

module.exports = Vehicle;
