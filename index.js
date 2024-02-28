var mqtt = require('./mqtt.js');
const dataM = require('./textMap.js');
const helpers = require('./helpers.js');

const WebSocket = require('ws');

console.log("Starting loop...");

const repeatInterval = 60;
var mqttConnected = false;

var deviceModel = '', deviceType = '', serialNumber = '', fanSpeed = "", outTemp = "";
var supTemp = "", indTemp = "", exhTemp = "", filterChanged = "", filterInterval = "";
var filterDue = "", devState = "", airRH = "";
var heliosUrl = "heliosb057a65650e8.house";
var mqttUrl = "homeassistant.house";
var mqttUser = "mqttUser";
var mqttPass = "mqttPass";
var dataUpdated = false;


function triggerWS() {
	var ws = new WebSocket('ws://'+ heliosUrl + ':80/');

	ws.on('close', function close(data) { console.log('connection closed with %s', data); });
	ws.on('error', function error(data) { console.log('connection error %s', data); });
	ws.on('open', function opened(dataWS) {
		console.log('WebSocket opened');
	        // sending message
	        let data = new Uint16Array(4);
	        data[0] = 3, data[1] = 246, data[2] = 0, data[3] = 249;
	        ws.send(data.buffer);
	        console.log('WS request for status sent');
	});

	ws.on('message', function message(data) {
	        console.log("Incomming message!");
	        console.log("Data length: %d", data.length);
	        if (data.byteLength !== 1410) {
	                console.log("Incorrect message length :( Ignoring...");
	        } else {
	                // get the necessary data
	                deviceModel = dataM.TextMap.TextMap.device_model_data[data[17 * 2 + 1]];
	                deviceType  = dataM.TextMap.TextMap.device_type_data[data[16 * 2 + 1]];
	                mqtt.setSerialNR(
										mqttUrl,
										mqttUser,
										mqttPass,
										data[14 * 2] * 16777216 + data[14 * 2 + 1] * 65536 + data[15 * 2] * 256 + data[15 * 2 + 1],
										deviceModel,
										deviceType,
										heliosUrl
									);
									mqtt.setFanSpeed(data[129]);
	                mqtt.setOutTemp(helpers.dataToCelsius(data, 67));
	                mqtt.setSupTemp(helpers.dataToCelsius(data, 69));
	                mqtt.setIndTemp(helpers.dataToCelsius(data, 65));
	                mqtt.setExhTemp(helpers.dataToCelsius(data, 66));
	                filterChanged = new Date(2000 + data[250 * 2 + 1], data[249 * 2 + 1] - 1, data[248 * 2 + 1], 0, 0);
									mqtt.setFilterChanged(filterChanged.toISOString());
	                var state = data[107 * 2 + 1];
	                var fire  = data[111 * 2 + 1];
	                var boost = data[110 * 2 + 1];
	                mqtt.setDevState(0 == fire ? 0 == boost ? 0 == state ? 'At home' : 'Away' : 'Boost' : 'Fireplace');
	                filterInterval = data[239 * 2 + 1] / 30;
	                mqtt.setFilterDue(new Date(filterChanged.getFullYear(), filterChanged.getMonth() + filterInterval, filterChanged.getDate(), 0, 0).toISOString());
	                mqtt.setAirRH(data[74 * 2 + 1]);
       		}
		ws.close();
	});
}


triggerWS();

setInterval( function() {
	console.log("Interval hit, doing action");
	triggerWS();
}, repeatInterval * 1000);
