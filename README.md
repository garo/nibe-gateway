This node.js application connects to a NibeGW (usually Arduino based).
It is based on an OpenHab implementation made by Pauli Anttila.

Main features:
 - Expose read registers to Prometheus for scraping.
 - Allows writing values to registers via MQTT and HTTP PUT. (to be implemented)
 - Simple web ui, mainly for debugging purposes.

Nibe Heat pump -> RS485 serial cable -> Arduino NibeGW -> udp traffic to this software.

See https://github.com/garo/openhab2-addons/tree/master/addons/binding/org.openhab.binding.nibeheatpump/NibeGW/Arduino/NibeGW on how to deploy the NibeGW hardware.
and
https://github.com/garo/openhab2-addons/tree/master/addons/binding/org.openhab.binding.nibeheatpump for the original OpenHab implementation.

