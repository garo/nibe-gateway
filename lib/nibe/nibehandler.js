"use strict";

const ModbusDataReadOutMessage = require('./modbusDataReadOutMessage');
const ModbusDataReadResponseMessage = require('./modbusReadResponseMessage');
const Protocol = require('./protocol.js');
const dgram = require('dgram');
const fs = require('fs');
const ModbusReadRequestMessage = require('./modbusReadRequestMessage');
const ModbusWriteRequestMessage = require('./modbusWriteRequestMessage');
const ModbusWriteResponseMessage = require('./modbusWriteResponseMessage');

const EventEmitter = require('events');

const CMD_RMU_DATA_MSG = 0x62;
const CMD_MODBUS_DATA_MSG = 0x68;
const CMD_MODBUS_READ_REQ = 0x69;
const CMD_MODBUS_READ_RESP = 0x6A;
const CMD_MODBUS_WRITE_REQ = 0x6B;
const CMD_MODBUS_WRITE_RESP = 0x6C;

const log = require('debug-level').log('nibe')


class NibeHandler extends EventEmitter {

    constructor() {
        super({ captureRejections: true });

        const variableInfoStr = fs.readFileSync("variableinfo.json");
        this.variableInfo = JSON.parse(variableInfoStr);
        const refreshListStr = fs.readFileSync("refreshlist.json");
        this.refreshList = JSON.parse(refreshListStr);

        
        this.refreshIntervalId = null;
        const self = this;

        this.refreshListIntervalId = setInterval(() => {
            fs.readFile("refreshlist.json", "utf8", (err, data) => {
                if (err) {
                    log.warn("Could not reload refreshlist.json", err);
                    return;
                }
                try {
                    self.refreshList = JSON.parse(data);
                } catch (e) {
                    log.warn("Error: could not parse refreshlist.json. Will not update!");
                }
            });

        }, 5000);
    }

    startRefreshing(hostname, port) {
        this.remoteHostname = hostname;
        this.remotePort = port;
        const self = this;

        this.refreshIntervalId = setInterval(() => {
            self.checkForVariablesToBeUpdated();

        }, 2500);
    }


    async listen(udpPort) {
        const server = dgram.createSocket('udp4');
        this.server = server;
        const self = this;

        server.on('error', (err) => {
            log.fatal("UDP listen error:", err);            
        });

        server.on('message', (msg, rinfo) => {
            self.handleMessage(msg);
        });

        server.on('listening', () => {
            const address = server.address();
            self.listenPort = address.port;
            self.listenHost = address.host;
        });

        return new Promise(resolve => {
            server.bind(udpPort, () => {
                resolve(server.address().port);
            });
        })
    }

    close() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }

        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = null;

        clearInterval(this.refreshListIntervalId);
        this.refreshListIntervalId = null;
    }

    handleMessage(data) {
        const messageType = Protocol.getMessageType(data);
        log.debug("Received message type", Protocol.getMessageTypeAsString(data));
        try {
            switch (messageType) {
                case CMD_MODBUS_DATA_MSG: // MODBUS_DATA_READ_OUT_MSG
                    this.handleModbusDataReadOutMsg(data);              
                    break;
                case CMD_MODBUS_READ_RESP: // MODBUS_DATA_READ_OUT_MSG
                    this.handleModbusReadResponseMessage(data);              
                    break;
                case CMD_MODBUS_WRITE_RESP: // MODBUS_DATA_READ_OUT_MSG
                    this.handleModbusWriteResponseMessage(data);              
                    break;
                default:
                    // No idea what these two are but they are constantly coming.
                    // Will just ignore them for now.
                    if (messageType != 0xee && messageType != 0x6d) {
                        log.error("Unknown message type:", messageType.toString(16));
                    }
            }
        } catch (e) {
            log.error("Error decoding message", data, "due to error:", e.message);
        }
    }

    handleModbusDataReadOutMsg(data) {
        const res = ModbusDataReadOutMessage.decode(data);

        Object.keys(res).forEach((coilAddress) => {
            const value = res[coilAddress];
            this.handleVariableUpdate(coilAddress, value);
        });
    }

    handleModbusReadResponseMessage(data) {
        const res = ModbusDataReadResponseMessage.decode(data, this.variableInfo);

        this.handleVariableUpdate(res.coilAddress, res.value);        
    }

    handleModbusWriteResponseMessage(data) {
        const ok = ModbusWriteResponseMessage.decode(data);

        if (this.lastWriteRequest == null || this.lastWriteRequest.state === null) {
            log.warn("Received Write Response message with res", ok, "but there wasn't any known pending write request");
            return;
        }

        log.info("Received Write Response on coil", this.lastWriteRequest.coilAddress, "to value", this.lastWriteRequest.value, "with result", ok);
        this.lastWriteRequest.state = ok;
    }

    getVariableInformation(coilAddress) {
        return this.variableInfo[coilAddress];
    }

    // Builds a list of variable keys which are due to be refreshed
    getRefreshableVariables() {
        const now = Date.now();

        const refreshable = [];
        Object.keys(this.refreshList).forEach(key => {
            if (!this.variableInfo[key]) {
                this.variableInfo[key] = {};
            }
            const variable = this.variableInfo[key];

            // Store the refresh value into the main variableInfo structure
            this.variableInfo[key]["refresh"] = this.refreshList[key];
            
            const lastUpdate = (variable["lastUpdate"] || 0);

            if (lastUpdate + (variable["refresh"] * 1000) < now) {
                refreshable.push({key: key, order: variable["lastUpdate"] - (variable["refresh"] * 1000)});
            }
        });

        return refreshable;
    }

    checkForVariablesToBeUpdated() {
        const refreshable = this.getRefreshableVariables();

        if (refreshable.length == 0) {
            return;
        }
        
        refreshable.sort((a, b) => (a.order > b.order) ? 1 : -1);

        const coilAddress = refreshable[0].key;

        this.issueReadRequest(coilAddress);

    }
        
    issueReadRequest(coilAddress) {
        const data = ModbusReadRequestMessage.create(coilAddress);

        const port = this.remotePort;
        const host = this.remoteHostname;

        log.debug("issueReadRequest(" + coilAddress + ") to " + host + ":" + port + ", data:" + data.toString('hex'));
        this.server.send(data, 0, data.length, port, host);

    }

    issueWriteRequest(coilAddress, value) {
        const data = ModbusWriteRequestMessage.create(coilAddress, value);

        const port = this.remotePort;
        const host = this.remoteHostname;

        log.debug("issueWriteRequest(" + coilAddress + ", " + value + ") to " + host + ":" + port + ", data:" + data.toString('hex'));
        this.lastWriteRequest = {
            coilAddress: coilAddress,
            value: value,
            state: null
        };
        this.server.send(data, 0, data.length, port, host);

    }

    handleVariableUpdate(coilAddress, value) {

        const variableInformation = this.getVariableInformation(coilAddress);
        if (!variableInformation) {
            log.error("Unknown coilAddress on incoming value:", coilAddress, "with value", value);
            return;
        }

        const scaled = Protocol.scaleNibeValue(variableInformation, value);

        variableInformation["lastUpdate"] = Date.now();
        variableInformation["lastValue"] = value;
        variableInformation["lastScaledValue"] = scaled;

        this.emit('modbusUpdate', {
            coilAddress: coilAddress,
            value: value,
            scaled: scaled,
            name: variableInformation.name
        });
    }
};

exports.NibeHandler = NibeHandler;
