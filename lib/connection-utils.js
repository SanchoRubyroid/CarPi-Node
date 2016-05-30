import io from 'socket.io'
import net  from 'net';
import yaml from 'js-yaml';
import fs   from 'fs';
import randomstring from "randomstring";

import VehicleManager from './vehicle-manager.js';
import StreamProcessor from './stream-processor.js';

class ConnectionUtils{
  constructor(){
    this.io = io(3001);
    this.config = yaml.safeLoad(fs.readFileSync('config.yml'));

    this.vehicleManager = new VehicleManager()
  }

  initializeBrowserListConnection(){
    this.io.of('/list').on('connection', (socket) => {
      this.reloadBrowserVehiclesList(socket)
    })
  }

  initializeBrowserControlConnection() {
    this.io.of('/control').on('connection', (socket) => {
      socket.on('capture', (vehicleName) => {
        let vehicle = this.vehicleManager.captureVehicle(vehicleName, socket)
        this.requestVideoStream(vehicle)
        this.reloadBrowserVehiclesList()
      })

      socket.on('disconnect', () => {
        this.vehicleManager.releaseVehicle(socket)
        this.reloadBrowserVehiclesList()
      })

      socket.on('car-control', (data) => {
        this.vehicleManager.controlVehicle(socket, new Buffer(data))
      })
    })

    this.io.of('/watch').on('connection', (socket) => {
      socket.on('capture', (vehicleName) => {
        let vehicle = this.vehicleManager.getVehicleByName(vehicleName);
        vehicle.emitVideoSettings(socket);
      })
    });
  }

  initializeVehiclesServer(){
    let vehiclesServer = net.createServer((socket) => {
      console.log('Vehicle connected')
      socket.id = randomstring.generate()
      this.vehicleManager.addVehicle(socket)

      socket.on('close', () => {
        this.vehicleManager.removeVehicle(socket)
        this.reloadBrowserVehiclesList()
        console.log('Vehicle socket closed')
      })

      // Vehicle speaks
      socket.on('data', (data) => {
        if(data == 'pong'){
          this.vehicleManager.processPong(socket);
        } else {
          this.vehicleManager.setVehicleSettings(data, socket)
          this.reloadBrowserVehiclesList()
        }
      });
    });

    vehiclesServer.listen(this.config['port'], this.config['host']);
  }

  requestVideoStream(vehicle){
    let streamProcessor = new StreamProcessor(this.config)
    vehicle.requestVideoStream(streamProcessor)
  }

  reloadBrowserVehiclesList(target = this.io.of('/list')){
    target.emit('cars-list', this.vehicleManager.getVehiclesList())
  }
}

export default ConnectionUtils;
