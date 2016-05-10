var ImageStream = require('./image-stream.js');

var method = StreamProcessor.prototype;

function StreamProcessor(socket) {
  this.videoSocket = socket
  this.imageStream = new ImageStream()
}

method.bind = function(socket) {
  this.controlSocket = socket
}

method.isBind = function() {
  return this.controlSocket != undefined
}

method.inputData = function(data) {
  this.imageStream.compose(data)

  if(this.imageStream.isImageReceived()) {
    var responceBufffer = Buffer.alloc(4)
    var writeValue = this.imageStream.imageLength()

    if(this.controlSocket)
      this.controlSocket.emit('stream', { image: true, buffer: imageStream.imageBase64()} )

    responce_buf.writeUInt32LE(writeValue, 0)
    this.videoSocket.write(responceBufffer)

    imageStream.reset()
  }
}

method.cleanUp = function() {}
