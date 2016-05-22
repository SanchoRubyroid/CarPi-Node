import Vehicle from './vehicle.js';

const REFRESH_CARS_LIST_ACTION = 'refresh-cars-list'

class VehicleManager{
  static get REFRESH_CARS_LIST_ACTION(){
    return REFRESH_CARS_LIST_ACTION;
  }

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
    vehicle.sendData(new Buffer([103,0,0])) // Request video stream
  }

  releaseVehicle(controlSocket){
    let vehicle = this.getVehicleByControlSocketID(controlSocket.id)
    if(vehicle) vehicle.release()
  }

  controlVehicle(controlSocket, data){
    let vehicle = this.getVehicleByControlSocketID(controlSocket.id)
    vehicle.sendData(data)
  }

  parseVehicleData(socket, data){
    let afterParseAction = null

    if(Vehicle.NAME_PATTERN.test(data)){
      this.setVehicleName(data, socket)
      afterParseAction = REFRESH_CARS_LIST_ACTION
    } else if(data == 'pong'){
      this.getVehicleBySocketID(socket.id).pong()
    }

    return afterParseAction
  }

  getControlSocket(vehicleName){
    let vehicle = this.getVehicleByName(vehicleName.toString().replace(Vehicle.NAME_PATTERN, ''))
    return vehicle.getControlSocket()
  }

  setVehicleName(data, socket){
    let vehicleName = data.toString().replace(Vehicle.NAME_PATTERN, '')
    console.log('Vehicle name: ' + vehicleName)
    let vehicle = this.getVehicleBySocketID(socket.id)
    vehicle.setName(vehicleName)
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
