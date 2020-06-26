const {NibeHandler} = require('./lib/nibe');

console.log("Starting nibe-to-mqtt gateway");

const nibe = new NibeHandler();

nibe.on('modbusUpdate', (modbusUpdate) => {
    console.log("Got modbusUpdate", modbusUpdate["coilAddress"], "value:", modbusUpdate["value"], modbusUpdate["name"]);
});

nibe.listen(9999)
.then(() => {
    //nibe.startRefreshing("172.16.142.10", 9999);
    nibe.remoteHostname = "172.16.142.10";
    nibe.remotePort = 9999;

    nibe.issueReadRequest(43416);
})

// Korjaa
// set service nat rule 1 inside-address address 10.96.2.78

/*
set service nat rule 1 inside-address address 172.16.196.104


set service nat rule 1 description 'nibe udp. kubessa namespace openhab, service openhab. inside-addressissa on servicen ip'
set service nat rule 1 destination address 172.16.140.5
set service nat rule 1 destination port 9998
set service nat rule 1 inbound-interface eth2
set service nat rule 1 inside-address address 172.16.196.104
set service nat rule 1 inside-address port 9999
set service nat rule 1 log enable
set service nat rule 1 protocol tcp_udp
set service nat rule 1 source
set service nat rule 1 type destination
*/