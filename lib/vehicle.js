class Vehicle{
  constructor(socket){
    this.socket = socket
    this.controlSocket = undefined
    this.name = null

    this.pingPeriodicDelayed()
  }

  pingPeriodic(){
    var socket = this.socket
    socket.pongReceived = false
    this.sendData(new Buffer([102, 0, 0]))

    setTimeout(() => {
      if(!socket.pongReceived)
        socket.destroy()
      else if(socket.writable)
        this.pingPeriodicDelayed()
    }, 1000)
  }

  pingPeriodicDelayed(){
    setTimeout(() => {
      this.pingPeriodic()
    }, 4000)
  }

  pong(){
    this.socket.pongReceived = true
  }

  sendData(data){
    if(this.socket.writable)
      this.socket.write(data)
  }

  requestVideoStream(streamProcessor){
    streamProcessor.setRatio(this.videoRatio);
    this.streamProcessor = streamProcessor;
    this.sendData(new Buffer([103, 0, 0]));

    let portNumber = Buffer.allocUnsafe(4);
    portNumber.writeUInt32LE(streamProcessor.getStreamingPort(), 0);
    this.sendData(portNumber);

    this.emitVideoSettings(this.controlSocket);
  }

  requestVideoStreamWithFreshSettings(streamProcessor){
    setTimeout(() => {
      if(this.freshSettings)
        this.requestVideoStream(streamProcessor)
      else
        this.requestVideoStreamWithFreshSettings(streamProcessor)
    }, 100);
  }

  emitVideoSettings(socket){
    socket.emit('stream',{
      port: this.streamProcessor.getWebPort(),
      ratio: this.videoRatio
    })
  }

  getName(){
    if(!this.name) throw new Error('Unexpected! Vehicle name was not set.')
    return this.name
  }

  getSocketID(){
    return this.socket.id
  }

  getControlSocketID(){
    if(this.controlSocket) return this.controlSocket.id
  }

  setSettings(settings){
    this.name = settings.vehicle_name
    this.videoRatio = settings.ratio
    this.freshSettings = true;

    console.log(`Vehicle name: ${this.name}`)
  }

  requestVideoQuality(videoQuality){
    this.sendData(new Buffer([107, videoQuality, 0]))
    this.freshSettings = false;
  }

  setControlSocket(socket){
    this.controlSocket = socket
  }

  isCaptured(){
    return this.controlSocket != undefined
  }

  release(){
    this.stopStream()
    if(this.controlSocket){
      this.controlSocket.emit('release')
      this.controlSocket = undefined
    }
    //console.log('['+ this.name +'] released')
  }

  stopStream(){
    if(this.streamProcessor) {
      this.sendData(new Buffer([105, 0, 0]))
      this.streamProcessor.closeStream();
    }
  }

  cleanUp(){
    this.release()
    this.name = null
  }
}

export default Vehicle;
