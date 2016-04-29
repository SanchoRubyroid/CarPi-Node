var io = require('socket.io')(3001);
var vehicleConnectionUtils = require('./lib/vehicle-connection-utils.js');

vehicleConnectionUtils.initializeVehiclesServer(io);

io.of('/list').on('connection', function (socket) {
  console.log('List Connection: ' + socket.id);

  // socket.on('disconnect', () => {
  //   console.log('Disconnected: ' + socket.id);
  // })

  socket.emit('cars-list', vehicleConnectionUtils.vehicleNames());
});

io.of('/control').on('connection', function (socket) {
  console.log('Control Connection: ' + socket.id);

  socket.on('controlled', (vehicle_name) => {
    socket.controlled_vehicle_name = vehicle_name

    if(vehicleConnectionUtils.captured(vehicle_name))
      throw new Error('Unexpected! Vehicle has already been captured.')

    vehicleConnectionUtils.captureVehicleSocket(vehicle_name)
    io.of('/list').emit('cars-list', vehicleConnectionUtils.vehicleNames())
  })

  socket.on('disconnect', () => {
    vehicleConnectionUtils.releaseVehicleSocket(socket.controlled_vehicle_name)
    io.of('/list').emit('cars-list', vehicleConnectionUtils.vehicleNames())
  })

  socket.on('car-control', (data) => {
    if(socket.controlled_vehicle_name === undefined)
      throw new Error('Unexpected! controlled_vehicle_name should have been set.')

    var vehicle_socket = vehicleConnectionUtils.getVehicleSocketByName(socket.controlled_vehicle_name)
    vehicle_socket.write(new Buffer(data))
  })
});
