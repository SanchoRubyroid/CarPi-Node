//var ImageStream = require('./image-stream.js');
class StreamProcessor{
  constructor(io, socket){
    this.io = io;
    this.videoSocket = socket;
    //this.imageStream = new ImageStream()
  }

  bind(socket){
    this.controlSocket = socket;
  }

  isBind(){
    return this.controlSocket != undefined;
  }

  inputData(data){
    // if(!this.beforeStreamEmitted){
    //   this.beforeStreamEmitted = true
    //   this.controlSocket.emit('before-stream')
    // }
    //
    // this.imageStream.compose(data)
    //
    // if(this.imageStream.isImageReceived()){
    //   var responseBufffer = Buffer.alloc(4)
    //   var writeValue = this.imageStream.imageLength()
    //
    //   if(this.controlSocket){
    //     this.io.of('/watch').emit('stream', { image: true, buffer: this.imageStream.imageBase64()} )
    //     this.controlSocket.emit('stream', { image: true, buffer: this.imageStream.imageBase64()} )
    //   }
    //
    //   responseBufffer.writeUInt32LE(writeValue, 0)
    //   this.videoSocket.write(responseBufffer)
    //
    //   this.imageStream.reset()
    // }
  }

  cleanUp(){}
}


export default StreamProcessor;
