import Vehicle from './vehicle.js';

class VehicleManager{
  constructor(){
    this.vehicles = []
  }

  getVehiclesList(){
    let vehicleNames = []
    let capturedVehicleNames = []

    for(let vehicle of this.vehicles){
      if(vehicle.isCaptured())
        capturedVehicleNames.push(vehicle.getName())
      else
        vehicleNames.push(vehicle.getName())
    }

    return [vehicleNames, capturedVehicleNames]
  }

  addVehicle(socket){
    this.vehicles.push(new Vehicle(socket))
  }

  removeVehicle(socket){
    let vehicleToRemove = this.getVehicleBySocketID(socket.id)
    let name = vehicleToRemove.getName()
    vehicleToRemove.cleanUp()
    this.vehicles.splice(this.vehicles.indexOf(vehicleToRemove, 1))

    //console.log('['+ name +'] removed')
  }

  captureVehicle(vehicleName, controlSocket){
    let vehicle = this.getVehicleByName(vehicleName)

    if(vehicle.isCaptured())
      throw new Error('Unexpected! Vehicle has already been captured.')

    //console.log('['+ vehicle.getName() +'] captured')

    vehicle.setControlSocket(controlSocket)

    return vehicle
  }

  releaseVehicle(controlSocket){
    let vehicle = this.getVehicleByControlSocketID(controlSocket.id)
    if(vehicle) vehicle.release()
  }

  controlVehicle(controlSocket, data){
    let vehicle = this.getVehicleByControlSocketID(controlSocket.id)
    vehicle.sendData(data)
  }

  setVideoQuality(controlSocket, videoQuality, streamProcessor){
    let vehicle = this.getVehicleByControlSocketID(controlSocket.id)
    vehicle.stopStream()
    vehicle.requestVideoQuality(videoQuality)

    vehicle.requestVideoStreamWithFreshSettings(streamProcessor)
  }

  processPong(socket){
    let vehicle = this.getVehicleBySocketID(socket.id)
    if(vehicle) vehicle.pong()
  }

  setVehicleSettings(vehicleSettings, socket){
    let vehicle = this.getVehicleBySocketID(socket.id)
    vehicle.setSettings(vehicleSettings)
  }

  getVehicleBySocketID(socketId){
    return this.vehicles.find(function(vehicle){
      return vehicle.getSocketID() == socketId
    })
  }

  getVehicleByControlSocketID(socketId){
    return this.vehicles.find(function(vehicle){
      return vehicle.getControlSocketID() == socketId
    })
  }

  getVehicleByName(name){
    return this.vehicles.find(function(vehicle){
      return vehicle.getName() == name
    })
  }
}

export default VehicleManager
