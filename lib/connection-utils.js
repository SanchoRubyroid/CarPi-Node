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

      socket.on('car-control', (data) => {
        this.vehicleManager.controlVehicle(socket, new Buffer(data))
      })

      socket.on('video-settings', (settings) => {
        let streamProcessor = new StreamProcessor(this.config)
        this.vehicleManager.setVideoQuality(socket, settings.videoQuality, streamProcessor)
      })

      socket.on('toggle-lights', (vehicleName) => {
        let vehicle = this.vehicleManager.getVehicleByName(vehicleName);
        vehicle.toggleLights();
      })

      socket.on('change-camera', () => {
        //TODO Implement me
      })

      socket.on('disconnect', () => {
        this.vehicleManager.releaseVehicle(socket)
        this.reloadBrowserVehiclesList()
      })
    })

    this.io.of('/watch').on('connection', (socket) => {
      socket.on('capture', (vehicleName) => {
        let vehicle = this.vehicleManager.getVehicleByName(vehicleName);
        vehicle.emitSettings(socket);
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
          // The incoming data might be either string 'pong' or JSON string with
          // vehicle settings. However, the TCP does not guarantee any boundaries,
          // so sometimes 'pong' is received together with settings :( Here comes
          // the workaround.
          if(/pong/.test(data)) {
            this.vehicleManager.processPong(socket);
            data = data.toString().replace(/pong/, '')
          }

          if(data.length > 0) {
            this.vehicleManager.setVehicleSettings(JSON.parse(data), socket)
            this.reloadBrowserVehiclesList()
          }
      });
    });

    vehiclesServer.listen(this.config['port'], this.config['host']);
  }

  requestVideoStream(vehicle){
    let streamProcessor = new StreamProcessor(this.config)

     // TODO REFACTOR!!!!
    setTimeout(() => {
      vehicle.requestVideoStream(streamProcessor)
    }, 10)
  }

  reloadBrowserVehiclesList(target = this.io.of('/list')){
    target.emit('cars-list', this.vehicleManager.getVehiclesList())
  }
}

export default ConnectionUtils;
