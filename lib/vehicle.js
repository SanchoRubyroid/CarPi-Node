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
    this.sendData(new Buffer([103, streamProcessor.getPortNumber(), 0]));

    this.emitVideoSettings(this.controlSocket);
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
    if(this.name) throw new Error('Unexpected! Vehicle name has already been set.')
    this.name = settings.vehicle_name
    this.videoRatio = settings.ratio

    console.log(`Vehicle name: ${this.name}`)
  }

  setControlSocket(socket){
    this.controlSocket = socket
  }

  isCaptured(){
    return this.controlSocket != undefined
  }

  release(){
    this.sendData(new Buffer([105, 0, 0])) // release command
    if(this.streamProcessor) this.streamProcessor.closeStream();
    this.controlSocket.emit('release')
    this.controlSocket = undefined
    //console.log('['+ this.name +'] released')
  }

  cleanUp(){
    this.release()
    //this._stopPing = true
    this.name = null
  }
}

export default Vehicle;
