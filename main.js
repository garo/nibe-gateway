const {NibeHandler} = require('./lib/nibe');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

const Prometheus = require('prom-client');
Prometheus.collectDefaultMetrics({timeout: 5000});

const gateway_address = (process.env["GATEWAY_ADDRESS"] || "172.16.142.10");
const gateway_port = Number((process.env["GATEWAY_PORT"] || 9999));

const nibe_register = new Prometheus.Gauge({
    name: 'nibe_register',
    help: 'Nibe register reading',
    labelNames: ['coilAddress', 'name']
  });
  
console.log("Starting nibe-to-mqtt gateway");

const nibe = new NibeHandler();

nibe.on('modbusUpdate', (modbusUpdate) => {
    //console.log("Got modbusUpdate", modbusUpdate["coilAddress"], "value:", modbusUpdate["value"], modbusUpdate["name"]);
    nibe_register.labels(modbusUpdate["coilAddress"], modbusUpdate["name"]).set(modbusUpdate["scaled"]);
});

nibe.listen(gateway_port)
.then(() => {
    console.log("Listening for NibeGW udp packets on port", gateway_port);
    if (gateway_address) {
        console.log("Gateway address is set to", gateway_address+":"+gateway_port, "so read commands are allowed.");
        nibe.startRefreshing(gateway_address, gateway_port);
    } else {
        console.log("Warning: GATEWAY_ADDRESS not set, read commands are not allowed");
    }
});

// Korjaa
// set service nat rule 1 inside-address address 10.96.2.78

/*
set service nat rule 1 inside-address address 172.16.196.104


set service nat rule 1 description 'nibe udp. kubessa namespace openhab, service openhab. inside-addressissa on servicen ip'
set service nat rule 1 destination address 172.16.140.5
set service nat rule 1 destination port 9998
set service nat rule 1 inbound-interface eth2
set service nat rule 1 inside-address address 10.102.90.109
set service nat rule 1 inside-address port 9999
set service nat rule 1 log enable
set service nat rule 1 protocol tcp_udp
set service nat rule 1 source
set service nat rule 1 type destination
*/

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, "public")));

app.get('/metrics', function(_, res) {
    res.type(Prometheus.register.contentType);
    res.send(Prometheus.register.metrics());
  });
app.get('/', function(req, res) {
    res.render('info', { 'variableInfo': nibe.variableInfo });
});
app.listen(port, () => console.log(`Listening for HTTP on port ${port}.`))
  
  