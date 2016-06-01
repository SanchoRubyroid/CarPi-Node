import ws from "ws";
import http from "http";
import portfinder from "portfinder";

class StreamProcessor{
  constructor(config){
    this.config = config

    portfinder.getPort((err, port) => {
        this.streamingPort = port
        this._initializeHttpServer()
        console.log(`Listening for MPEG Stream on ${this.config['host']}:${this.getStreamingPort()}/<width>/<height>`);
    });

    portfinder.getPort((err, port) => {
        this.WebPort = port
        this._initializeWebSocketServer()
        console.log(`Awaiting WebSocket connections on ${this.config['host']}:${this.getWebPort()}/`);
    });
  }

  setRatio(ratio){
    this.width = ratio.factor*ratio.horizontal;
	  this.height = ratio.factor*ratio.vertical;
  }

  getStreamingPort(){
    return this.streamingPort;
  }

  getWebPort(){
    return this.WebPort;
  }

  closeStream(){
    this.socketServer.close()
    this.streamServer.close()
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
    		if (client.readyState == 1)
    			client.send(data, opts);
    	}
    };
  }

  _initializeHttpServer(){
    this.streamServer = http.createServer((request, response) => {
  		response.connection.setTimeout(0);

  		console.log(`Stream Connected: ${ request.socket.remoteAddress }:${ request.socket.remotePort } size: ${ this.width }x${ this.height }`);

  		request.on('data', (data) => {
  			this.socketServer.broadcast(data, {binary:true});
  		});

    }).listen(this.getStreamingPort());
  }
}


export default StreamProcessor;
