import ConnectionUtils from './lib/connection-utils.js';

let connectionUtils = new ConnectionUtils();

connectionUtils.initializeVehiclesServer();
connectionUtils.initializeVideoStreamServer();

connectionUtils.initializeBrowserListConnection();
connectionUtils.initializeBrowserControlConnection();
