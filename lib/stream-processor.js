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
    var responseBufffer = Buffer.alloc(4)
    var writeValue = this.imageStream.imageLength()

    if(this.controlSocket)
      this.controlSocket.emit('stream', { image: true, buffer: this.imageStream.imageBase64()} )

    responseBufffer.writeUInt32LE(writeValue, 0)
    this.videoSocket.write(responseBufffer)

    this.imageStream.reset()
  }
}

method.cleanUp = function() {}

module.exports = StreamProcessor;