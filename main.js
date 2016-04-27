var io = require('socket.io')(4001);
var vehicleConnectionUtils = require('./lib/vehicle-connection-utils.js');

vehicleConnectionUtils.initializeVehiclesServer(io);

io.of('/list').on('connection', function (socket) {
  console.log('List Connection: ' + socket.id);

  socket.on('disconnect', () => {
    console.log('Disconnected: ' + socket.id);
  })

  socket.emit('cars-list', vehicleConnectionUtils.vehicleNames());
});

io.of('/control').on('connection', function (socket) {
  console.log('Control Connection: ' + socket.id);

  socket.on('controlled', (vehicle_name) => {
    // TODO Check if already controlled
    socket.controlled_vehicle_name = vehicle_name
  })

  socket.on('car-control', (data) => {
    //TODO Check if name set
    var vehicle_socket = vehicleConnectionUtils.getSocketByName(socket.controlled_vehicle_name)
    vehicle_socket.write(new Buffer(data))
    //socket.controlled_vehicle_socket.write(new Buffer(data))
  })
});
