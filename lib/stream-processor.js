import ws from "ws";
import http from "http";

let streamPortBaseOffset = 20000
let maxPorts = 256
let existingPorts = []

class StreamProcessor{
  constructor(config){
    // TODO refactor
    this.width = 80*16,
	  this.height = 80*9;

    let portBase = parseInt(config['port'])

    this.config = config

    this.currentPortNumber = this._getPort(0)
    existingPorts.push(this.currentPortNumber)

    this._initializeWebSocketServer()
    this._initializeHttpServer()

    console.log(`Listening for MPEG Stream on ${this.config['host']}:${this.getStreamingPort()}/<width>/<height>`);
    console.log(`Awaiting WebSocket connections on ${this.config['host']}:${this.getWebPort()}/`);
  }

  getPortNumber(){
    return this.currentPortNumber;
  }

  getStreamingPort(){
    return this.currentPortNumber + streamPortBaseOffset + maxPorts;
  }

  getWebPort(){
    return this.currentPortNumber + streamPortBaseOffset;
  }

  closeStream(){
    this.socketServer.close()
    this.streamServer.close()

    existingPorts.splice(existingPorts.indexOf(this.currentPortNumber , 1))
  }

  _initializeWebSocketServer(){
    this.socketServer = new (ws.Server)({port: this.getWebPort()});

    this.socketServer.on('connection', (socket) => {
    	// Send magic bytes and video size to the newly connected socket
    	// struct { char magic[4]; unsigned short width, height;}
    	let streamHeader = new Buffer(8);
    	streamHeader.write('jsmp');
    	streamHeader.writeUInt16BE(this.width, 4);
    	streamHeader.writeUInt16BE(this.height, 6);
    	socket.send(streamHeader, {binary:true});

    	console.log( `New WebSocket Connection (${ this.socketServer.clients.length } total)` );

    	socket.on('close', (code, message) => {
    		console.log( `Disconnected WebSocket (${ this.socketServer.clients.length } total)` );
    	});
    });

    this.socketServer.broadcast = function(data, opts) {
    	for(let client of this.clients) {
    		if (client.readyState == 1) {
    			client.send(data, opts);
    		}
    		else {
    			console.log( `Error: Client (${i}) not connected.` );
    		}
    	}
    };
  }

  _initializeHttpServer(){
    this.streamServer = http.createServer((request, response) => {
    	let params = request.url.substr(1).split('/');

  		response.connection.setTimeout(0);

  		let width = (params[0] || this.width)|0;
  		let height = (params[1] || this.height)|0;

  		console.log(`Stream Connected: ${ request.socket.remoteAddress }:${ request.socket.remotePort } size: ${ width }x${ height }`);

  		request.on('data', (data) => {
  			this.socketServer.broadcast(data, {binary:true});
  		});

    }).listen(this.getStreamingPort());
  }

  _getPort(tryPort){
    return existingPorts.includes(tryPort) ? this._getPort(tryPort + 1) : tryPort
  }
}


export default StreamProcessor;
