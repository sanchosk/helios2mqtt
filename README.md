# Helios KWL 300 to MQTT for HomeAssistant

This is a simple nodeJS tool that runs every minute and reports ModBus data, received over Javascript WebSocket to HomeAssistant.
It will automatically create the device in HomeAssistant as MQTT device and start to feed the data.
Serial number of the Helios is used for creation of unique device.
