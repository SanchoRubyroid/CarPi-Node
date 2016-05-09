var method = Vehicle.prototype;

Vehicle.prototype.namePattern = /^vn:/

function Vehicle(socket) {
  this._socket = socket
  this._control_socket = undefined
  this._video_socket = undefined
  this._name = null

  this.pingPeriodic()
}

method.pingPeriodic = function() {
  this._socket.pong_received = false
  if(this._socket.writable)
    this._socket.write(new Buffer([102, 0, 0]))

  setTimeout(function() {
    if(!this._socket.pong_received) {
      this._socket.destroy()
    } else if(this._socket.writable) {
      if(!this._stopPing)
        setTimeout(function(){ pingPeriodic() }, 4000)
    }
  }, 1000)
}

method.pong = function() {
  this._socket.pong_received = true
}

method.send = function(data){
  this._socket.write(data)
}

method.getName = function() {
  if(!this._name) throw new Error('Unexpected! Vehicle name was not set.')
  return this._name
}

method.getSocketID = function() {
  return this._socket.id
}

method.getControlSocketID = function() {
  if(!this._control_socket) throw new Error('Unexpected! Vehicle is not controlled.')
  return this._control_socket.id
}

method.getVideoSocketID = function() {
  if(!this._video_socket) throw new Error('Unexpected! Video socket is not set.')
  return this._video_socket.id
}

method.setName = function(name) {
  if(this._name) throw new Error('Unexpected! Vehicle name has already been set.')
  this._name = name
}

method.setControlSocket = function(socket) {
  this._control_socket = socket
}

method.initializeVideoSocket = function(socket) {
  this._video_socket = socket
  this._video_socket.image_stream = new ImageStream()

  this._control_socket.emit('init-video')
}

method.videoData = function(data) {
  var image_stream = this._video_socket.image_stream
  image_stream.compose(data)

  if(image_stream.isImageReceived()) {
    var responce_buf = Buffer.alloc(4)
    var write_value = image_stream.imageLength()

    if(this._video_socket.release) {
      console.log('STOP STREAMING')
      write_value = 0xFFFFFFFF
    }

    responce_buf.writeUInt32LE(write_value, 0)
    this._video_socket.write(responce_buf)

    this._control_socket.emit('stream', { image: true, buffer: image_stream.imageBase64()} )

    image_stream.reset()
  }
}

method.isCaptured = function() {
  return this._control_socket != undefined
}

method.release = function() {
  this._control_socket = undefined
  this._video_socket.release = true
}

method.cleanUp = function() {
  this.release()

  this._stopPing = true
  this._name = null
}
