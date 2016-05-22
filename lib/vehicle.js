const NAME_PATTERN = /^vn:/

class Vehicle{
  static get NAME_PATTERN(){
    return NAME_PATTERN;
  }

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

  getName(){
    if(!this.name) throw new Error('Unexpected! Vehicle name was not set.')
    return this.name
  }

  getSocketID(){
    return this.socket.id
  }

  getControlSocket(){
    return this.controlSocket
  }

  getControlSocketID(){
    if(this.controlSocket) return this.controlSocket.id
  }

  setName(name){
    if(this.name) throw new Error('Unexpected! Vehicle name has already been set.')
    this.name = name
  }

  setControlSocket(socket){
    this.controlSocket = socket
  }

  isCaptured(){
    return this.controlSocket != undefined
  }

  release(){
    this.sendData(new Buffer([105, 0, 0])) // release command
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
