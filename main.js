const {NibeHandler} = require('./lib/nibe');
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

const Prometheus = require('prom-client');
Prometheus.collectDefaultMetrics({timeout: 5000});

const gateway_address = (process.env["GATEWAY_ADDRESS"] || "172.16.142.10");
const gateway_port = Number((process.env["GATEWAY_PORT"] || 9999));
const Log = require('debug-level')
const log = Log.log('main')

Log.options({level: 'DEBUG'});

const nibe_register = new Prometheus.Gauge({
    name: 'nibe_register',
    help: 'Nibe register reading',
    labelNames: ['coilAddress', 'name']
  });
  
console.log("Starting nibe-gateway");

const nibe = new NibeHandler();

nibe.on('modbusUpdate', (modbusUpdate) => {
    log.debug("Got modbusUpdate", modbusUpdate["coilAddress"], "value:", modbusUpdate["value"], modbusUpdate["name"]);
    nibe_register.labels(modbusUpdate["coilAddress"], modbusUpdate["name"]).set(modbusUpdate["scaled"]);
});

nibe.listen(gateway_port)
.then(() => {
    log.log("Listening for NibeGW udp packets on port", gateway_port);
    if (gateway_address) {
        log.log("Gateway address is set to", gateway_address+":"+gateway_port, "so read commands are allowed.");
        if (process.env['ENABLE_READ_COMMANDS']) {
            nibe.startRefreshing(gateway_address, gateway_port);
            console.log("ENABLE_READ_COMMANDS is set, so enabling read commands");
        } else {
            console.log("ENABLE_READ_COMMANDS is not set, so read commands are disabled");
        }
    } else {
        log.log("Warning: GATEWAY_ADDRESS not set, read commands are not allowed");
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
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(express.static(path.join(__dirname, "public")));

app.get('/metrics', async function(req, res) {
    res.type(Prometheus.register.contentType);
    res.end(await Prometheus.register.metrics());
});

app.get('/', function(req, res) {
    res.render('info', { 'variableInfo': nibe.variableInfo, 'lastWriteRequest': nibe.lastWriteRequest });
});
app.post('/write', function(req, res) {
    const coilAddress = Number(req.body.coilAddress);
    const value = Number(req.body.value);
    if (coilAddress <= 0 || coilAddress > 65535) {
        throw new Error("coilAddress out of range");
    }

    nibe.issueWriteRequest(coilAddress, value);
    res.redirect(303, '/');
});
app.listen(port, () => log.info(`Listening for HTTP on port ${port}.`))
  
  