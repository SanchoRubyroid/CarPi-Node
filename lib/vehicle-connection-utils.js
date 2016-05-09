var net  = require('net');
var yaml = require('js-yaml');
var fs   = require('fs');

var vehicles_sockets = []
var vehicles_video_sockets = []
var config = yaml.safeLoad(fs.readFileSync('config.yml'));
var vehicle_name_pattern = /^vn:/
var last_captured = null

vehicleNames = function() {
  var vehicle_names = []
  var captured_vehicle_names = []

  vehicles_sockets.forEach(function(vehicles_socket){
    if(vehicles_socket.captured)
      captured_vehicle_names.push(vehicles_socket.vehicle_name)
    else
      vehicle_names.push(vehicles_socket.vehicle_name)
  })

  return [vehicle_names, captured_vehicle_names]
}

getVehicleSocketByName = function(vehicle_name) {
  return vehicles_sockets.find(function(socket) {
    return socket.vehicle_name === vehicle_name
  })
}

getVehicleVideoSocketByName = function(vehicle_name) {
  return vehicles_video_sockets.find(function(socket) {
    return socket.vehicle_name === vehicle_name
  })
}

ping = function(socket) {
  socket.pong_received = false
  if(socket.writable)
    socket.write(new Buffer([102, 0, 0]))

  setTimeout(function() {
    if(!socket.pong_received) {
      socket.destroy()
    } else if(socket.writable) {
      setTimeout(function(){ ping(socket) }, 4000)
    }
  }, 1000)
}

exports.initializeVehiclesServer = function(io) {
  var vehicles_server = net.createServer(function(socket) {
    vehicles_sockets.push(socket)

    ping(socket)

    socket.on('close', () => {
      vehicles_sockets.splice(vehicles_sockets.indexOf(socket.vehicle_name),1)
      io.of('/list').emit('cars-list', vehicleNames());
    })

    socket.on('data', (data) => {
      if(vehicle_name_pattern.test(data)) {
        var vehicle_name = data.toString().replace(vehicle_name_pattern, '')
        socket.vehicle_name = vehicle_name
        io.of('/list').emit('cars-list', vehicleNames());
      } else if(data == 'pong') {
        socket.pong_received = true
      }
    });
  });

  vehicles_server.listen(config['port'], config['host']);
}

exports.initializeVideoStreamServer = function(io, verbose) {
  var stream_server = net.createServer(function(socket) {
    socket.remaining_length = 0
    socket.image_buffer = new Buffer (0)
    vehicles_video_sockets.push(socket)

    if(!socket.controlled_socket)
      socket.controlled_socket = last_captured

    socket.on('data', (data) => {
      if(verbose) console.log("NEW CHUNK: " + data.length)

      if(socket.remaining_length == 0) {
        socket.remaining_length = data.readUInt32LE(0)
        data = data.slice(4)
        if(verbose) console.log("-- IMAGE LEN: " + remaining_length)
      }

      if(data.length > 0) {
        socket.image_buffer = Buffer.concat([socket.image_buffer, data], socket.image_buffer.length + data.length)
        socket.remaining_length -= data.length

        if(verbose) console.log("CHUNK BUFF: " + data.length + ' LEN REMAINING: ' + remaining_length)

        if(socket.remaining_length == 0) {
          if(verbose) console.log('IMAGE RECEIVED!')

          var responce_buf = Buffer.alloc(4)
          var write_value = socket.image_buffer.length

          if(socket.release){
            console.log('STOP STREAMING')
            write_value = 0xFFFFFFFF
          }

          responce_buf.writeUInt32LE(write_value, 0)
          socket.write(responce_buf)

          socket.controlled_socket.emit('stream', { image: true, buffer: socket.image_buffer.toString('base64') } )

          socket.image_buffer = new Buffer(0)
        }
      }
    });

    socket.on('close', () => {
      console.log("closed sock")
      socket.image_buffer = null
    });

    socket.on('error', (err) => {
      console.log("ERROR: " + err)
    })
  });

  stream_server.listen(parseInt(config['port'])+1, config['host']);
}

exports.sendToVehicle = function(vehicle_name, data) {
  var vehicle_socket = getVehicleSocketByName(vehicle_name)
  vehicle_socket.write(data)
}

exports.captureVehicleSocket = function(vehicle_name, captured_by_socket) {
  getVehicleSocketByName(vehicle_name).captured = true
  last_captured = captured_by_socket
}

exports.releaseVehicleSocket = function(socket) {
  var vehicle_socket = getVehicleSocketByName(socket.vehicle_name)
  if(vehicle_socket)
    getVehicleSocketByName(socket.vehicle_name).captured = false

  var video_socket = vehicles_video_sockets.find(function(sck) {
    sck.socket == socket
  })

  if(video_socket) {
    video_socket.release = true
    vehicles_video_sockets.splice(vehicles_video_sockets.indexOf(video_socket),1)
  }
}

exports.captured = function(vehicle_name) {
  return getVehicleSocketByName(vehicle_name).captured
}

exports.vehicleNames = vehicleNames
exports.getVehicleSocketByName = getVehicleSocketByName
