This node.js application connects to a NibeGW (usually Arduino based).
It is based on an OpenHab implementation made by Pauli Anttila.

Main features:
 - Expose read registers to Prometheus for scraping.
 - Allows writing values to registers via MQTT and HTTP PUT. (to be implemented)
 - Simple web ui, mainly for debugging purposes and to write values to registers.

Nibe Heat pump -> RS485 serial cable -> Arduino NibeGW -> udp traffic to this software.

See https://github.com/openhab/openhab-addons/tree/2.5.x/bundles/org.openhab.binding.nibeheatpump/contrib/NibeGW on how to deploy the NibeGW hardware.
and
https://github.com/openhab/openhab-addons/tree/2.5.x/bundles/org.openhab.binding.nibeheatpump for the original OpenHab implementation.

Screenshot



