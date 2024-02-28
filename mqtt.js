const mqtt = require('mqtt');


var client;
var mqttConnected = false;
var deviceCreated = false;

var serialNR = '';
var fanSpeed = "";
var outTemp = "";
var supTemp = "";
var indTemp = "";
var exhTemp = "";
var filterChanged = "";
var devState = "";
var filterDue = "";
var airRH = "";

function createHAsingle(payload) {
    client.publish('homeassistant/sensor/' + payload.unique_id + '/config', JSON.stringify(payload), { qos: 0, retain: false }, (error) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Published: ' + JSON.stringify(payload));
        }
    })
}

function createHAall(serialNR, heliosModel, heliosType, heliosUrl) {
  console.log("Creating device with serial number %s, model %s, type %s and url %s", serialNR, heliosModel, heliosType, heliosUrl);
    // fan
    createHAsingle({
        'name' : 'Fan speed',
        'state_topic': 'helios/' + serialNR + '/fan',
        'unique_id' : 'helios_' + serialNR + '_fanSpeed',
        'device' : {
            'name' : 'Helios ' + heliosModel,
            'configuration_url' : 'http://' + heliosUrl + '/',
            'model' : heliosType,
            'manufacturer' : 'Helios',
            'identifiers' : [
                serialNR
            ]
        },
        'icon' : 'mdi:fan',
        'unit_of_measurement' : '%'
    });

    // outTemp
    createHAsingle({
        'name' : 'Temperature outside',
        'state_topic': 'helios/' + serialNR + '/outTemp',
        'unique_id' : 'helios_' + serialNR + '_outTemp',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'temperature',
        'unit_of_measurement' : '°C'
    });

    // supply temperature
    createHAsingle({
        'name' : 'Temperature supply',
        'state_topic': 'helios/' + serialNR + '/supTemp',
        'unique_id' : 'helios_' + serialNR + '_supTemp',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'temperature',
        'unit_of_measurement' : '°C'
    });

    // indoor temperature
    createHAsingle({
        'name' : 'Temperature indoor',
        'state_topic': 'helios/' + serialNR + '/indTemp',
        'unique_id' : 'helios_' + serialNR + '_indTemp',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'temperature',
        'unit_of_measurement' : '°C'
    });

    // exhaust temperature
    createHAsingle({
        'name' : 'Temperature exhaust',
        'state_topic': 'helios/' + serialNR + '/exhTemp',
        'unique_id' : 'helios_' + serialNR + '_exhTemp',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'temperature',
        'unit_of_measurement' : '°C'
    });

    // air humidity
    createHAsingle({
        'name' : 'Air humidity',
        'state_topic': 'helios/' + serialNR + '/airRH',
        'unique_id' : 'helios_' + serialNR + '_airRH',
        'device' : { 'identifiers' : [ serialNR] },
        'device_class' : 'humidity',
        'unit_of_measurement' : '%'
    });

    // device state
    createHAsingle({
        'name' : 'State',
        'state_topic': 'helios/' + serialNR + '/devState',
        'unique_id' : 'helios_' + serialNR + '_devState',
        'device' : { 'identifiers' : [ serialNR ] },
        'icon' : 'mdi:home-edit'
    });

    // filter change date
    createHAsingle({
        'name' : 'Filter last changed',
        'state_topic': 'helios/' + serialNR + '/filterChanged',
        'unique_id' : 'helios_' + serialNR + '_filterChanged',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'date'
    });

    // filter due
    createHAsingle({
        'name' : 'Filter change due',
        'state_topic': 'helios/' + serialNR + '/filterDue',
        'unique_id' : 'helios_' + serialNR + '_filterDue',
        'device' : { 'identifiers' : [ serialNR ] },
        'device_class' : 'date'
    });
}

function createClient(mqttUrl, clientId, mqttUser, mqttPass) {
  if (typeof(client) !== 'undefined') return;
  var connectUrl = 'mqtt://' + mqttUrl + ':1883';
  client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: mqttUser,
    password: mqttPass,
    reconnectPeriod: 10000,
  })

  client.on('connect', () => {
    console.log('MQTT connected');
    // if(serialNR !== '') createHAall(serialNR);
  })

  client.on('close', () => {
  	console.log('MQTT disconnected');
  })
}

function mqttData(key, value) {
  client.publish('helios/' + serialNR + '/' + key, value, { qos: 0, retain: false }, (error) => {
      if (error) {
          console.log(error);
      } else {
          console.log('Published: %s => %s', key, value);
      }
  })
}

module.exports = {
        setSerialNR:function(mqttUrl, mqttUser, mqttPass, serialNumber, newHeliosModel, newHeliosType, newHeliosUrl) {

          createClient(mqttUrl, 'helios2mqtt_' + serialNumber, mqttUser, mqttPass);
          if(serialNR === serialNumber) {
            // we already had this serial, no need to create new deviceModel
            console.log("No serial NR update, device exists");
            deviceCreated = true;
          } else {
            serialNR = serialNumber;
            console.log("New serial number is %s", serialNR);
            createHAall(serialNR, newHeliosModel, newHeliosType, newHeliosUrl);
          }
        },
        setFanSpeed:function(newFanSpeed) {

          if (deviceCreated === false || fanSpeed === newFanSpeed) {
            console.log("Fan speed equal, not reporting");
          } else {
            fanSpeed = newFanSpeed;
            mqttData('fan', fanSpeed.toString());
          }
        },
        setOutTemp:function(newOutTemp) {
          if (deviceCreated === false || outTemp === newOutTemp) {
            console.log("Out temp equal, not reporting");
          } else {
            outTemp = newOutTemp;
            mqttData('outTemp', outTemp.toString());
          }
        },
        setSupTemp:function(newSupTemp) {
          if (deviceCreated === false || supTemp === newSupTemp) {
            console.log("Supply temp equal, not reporting");
          } else {
            supTemp = newSupTemp;
            mqttData('supTemp', supTemp.toString());
          }
        },
        setIndTemp:function(newIndTemp) {
          if (deviceCreated === false || indTemp === newIndTemp) {
            console.log("Indoor temp equal, not reporting");
          } else {
            indTemp = newIndTemp;
            mqttData('indTemp', indTemp.toString());
          }
        },
        setExhTemp:function(newExhTemp) {
          if (deviceCreated === false || exhTemp === newExhTemp) {
            console.log("Exhaust temp equal, not reporting");
          } else {
            exhTemp = newExhTemp;
            mqttData('exhTemp', exhTemp.toString());
          }
        },
        setFilterChanged:function(newFilterChanged) {
          if (deviceCreated === false || filterChanged === newFilterChanged) {
            console.log("Filter change date equal, not reporting");
          } else {
            filterChanged = newFilterChanged;
            mqttData('filterChanged', filterChanged.toString());
          }
        },
        setDevState:function(newDevState) {
          if (deviceCreated === false || devState === newDevState) {
            console.log("Device state equal, not reporting");
          } else {
            devState = newDevState;
            mqttData('devState', devState.toString());
          }
        },
        setFilterDue:function(newFilterDue) {
          if (deviceCreated === false || filterDue === newFilterDue) {
            console.log("Device state equal, not reporting");
          } else {
            filterDue = newFilterDue;
            mqttData('filterDue', filterDue.toString());
          }
        },
        setAirRH:function(newAirRH) {
          if (deviceCreated === false || airRH === newAirRH) {
            console.log("Air humidity equal, not reporting");
          } else {
            airRH = newAirRH;
            mqttData('airRH', airRH.toString());
          }
        }

}
;
