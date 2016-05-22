const NAME_PATTERN = /^vn:/

class Vehicle(socket){
  static get NAME_PATTERN(){
    return NAME_PATTERN;
  }

  constructor(){
    this.socket = socket
    this.controlSocket = undefined
    this.name = null

    pingPeriodicDelayed()
  }

  namepingPeriodic(){
    var socket = this.socket
    socket.pongReceived = false
    sendData(new Buffer([102, 0, 0]))

    setTimeout(() => {
      if(!socket.pongReceived)
        socket.destroy()
      else if(socket.writable)
        pingPeriodicDelayed()
    }, 1000)
  }

  namepingPeriodicDelayed(){
    setTimeout(() => {
      pingPeriodic()
    }, 4000)
  }

  namepong(){
    this.socket.pongReceived = true
  }

  namesendData(data){
    if(this.socket.writable)
      this.socket.write(data)
  }

  namegetName(){
    if(!this.name) throw new Error('Unexpected! Vehicle name was not set.')
    return this.name
  }

  namegetSocketID(){
    return this.socket.id
  }

  namegetControlSocket(){
    return this.controlSocket
  }

  namegetControlSocketID(){
    if(this.controlSocket) return this.controlSocket.id
  }

  namesetName(name){
    if(this.name) throw new Error('Unexpected! Vehicle name has already been set.')
    this.name = name
  }

  namesetControlSocket(socket){
    this.controlSocket = socket
  }

  nameisCaptured(){
    return this.controlSocket != undefined
  }

  namerelease(){
    this.sendData(new Buffer([105, 0, 0])) // release command
    this.controlSocket = undefined
    //console.log('['+ this.name +'] released')
  }

  namecleanUp(){
    this.release()
    //this._stopPing = true
    this.name = null
  }
}

export default Vehicle;
