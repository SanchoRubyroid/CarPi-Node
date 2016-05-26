import ConnectionUtils from './lib/connection-utils.js';

let connectionUtils = new ConnectionUtils();

connectionUtils.initializeVehiclesServer();

connectionUtils.initializeBrowserListConnection();
connectionUtils.initializeBrowserControlConnection();
