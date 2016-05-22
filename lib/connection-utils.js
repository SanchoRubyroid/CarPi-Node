import io from 'socket.io' //(3001);
import net  from 'net';
import yaml from 'js-yaml';
import fs   from 'fs';
import randomstring from "randomstring";

import VehicleManager from './vehicle-manager.js';

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
        this.vehicleManager.captureVehicle(vehicleName, socket)
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
        let afterParsePction = this.vehicleManager.parseVehicleData(socket, data)

        if(afterParsePction == this.vehicleManager.REFRESH_CARS_LIST_ACTION)
          this.reloadBrowserVehiclesList()
      });
    });

    vehiclesServer.listen(this.config['port'], this.config['host']);
  }

  initializeVideoStreamServer(){
    // var stream_server = net.createServer(function(socket) {
    //   console.log('Video stream connected')
    //
    //   socket.id = randomstring.generate()
    //   var streamProcessor = new StreamProcessor(io, socket)
    //
    //   socket.on('data', (data) => {
    //     if(!streamProcessor.isBind())
    //       streamProcessor.bind(this.vehicleManager.getControlSocket(data))
    //     else
    //       streamProcessor.inputData(data)
    //   });
    //
    //   socket.on('close', () => {
    //     console.log("Video stream socket closed")
    //     streamProcessor.cleanUp()
    //   });
    //
    //   socket.on('error', (err) => {
    //     console.log("ERROR: " + err)
    //   })
    // });
    //
    // stream_server.listen(parseInt(this.config['port'])+1, this.config['host']);
  }

  reloadBrowserVehiclesList(target = this.io.of('/list')){
    target.emit('cars-list', this.vehicleManager.getVehiclesList())
  }
}

export default ConnectionUtils;
