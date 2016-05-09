var connectionUtils = require('./lib/connection-utils.js');

connectionUtils.initializeVehiclesServer();
connectionUtils.initializeVideoStreamServer();

connectionUtils.initializeBrowserListConnection();
connectionUtils.initializeBrowserControlConnection();
