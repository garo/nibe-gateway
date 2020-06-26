"use strict";

const ModbusDataReadOutMessage = require('./modbusDataReadOutMessage');
const ModbusDataReadResponseMessage = require('./modbusReadResponseMessage');
const Protocol = require('./protocol.js');
const dgram = require('dgram');
const fs = require('fs');
const ModbusReadRequestMessage = require('./modbusReadRequestMessage');

const EventEmitter = require('events');

const CMD_RMU_DATA_MSG = 0x62;
const CMD_MODBUS_DATA_MSG = 0x68;
const CMD_MODBUS_READ_REQ = 0x69;
const CMD_MODBUS_READ_RESP = 0x6A;
const CMD_MODBUS_WRITE_REQ = 0x6B;
const CMD_MODBUS_WRITE_RESP = 0x6C;

class NibeHandler extends EventEmitter {

    constructor() {
        super({ captureRejections: true });

        const variableInfoStr = fs.readFileSync("variableinfo.json");
        this.variableInfo = JSON.parse(variableInfoStr);

        
        this.refreshIntervalId = null;
    }

    startRefreshing(hostname, port) {
        this.remoteHostname = hostname;
        this.remotePort = port;
        const self = this;

        this.refreshIntervalId = setInterval(() => {
            self.checkForVariablesToBeUpdated();

        }, 1000);
    }


    async listen(udpPort) {
        const server = dgram.createSocket('udp4');
        this.server = server;
        const self = this;

        server.on('error', (err) => {
            console.error("UDP listen error:", err);            
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
    }

    handleMessage(data) {
        const messageType = Protocol.getMessageType(data);
        console.log("Received message type", Protocol.getMessageTypeAsString(data));
        try {
            switch (messageType) {
                case CMD_MODBUS_DATA_MSG: // MODBUS_DATA_READ_OUT_MSG
                    this.handleModbusDataReadOutMsg(data);              
                    break;
                case CMD_MODBUS_READ_RESP: // MODBUS_DATA_READ_OUT_MSG
                    this.handleModbusReadResponseMessage(data);              
                    break;
                default:
                    console.error("Unknown message type:", messageType.toString(16));
            }
        } catch (e) {
            console.log("Error decoding message", data, "due to error:", e.message);
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

    getVariableInformation(coilAddress) {
        return this.variableInfo[coilAddress];
    }

    // Builds a list of variable keys which are due to be refreshed
    getRefreshableVariables() {
        const now = Date.now();

        const refreshable = [];
        Object.keys(this.variableInfo).forEach(key => {
            const variable = this.variableInfo[key];
            if (!variable.refresh) {
                return;
            }

            const lastUpdate = (variable["lastUpdate"] || 0);

            if (lastUpdate + variable["refresh"] < now) {
                refreshable.push({key: key, order: variable["lastUpdate"] - variable["refresh"]});
            }
        });

        return refreshable;
    }

    checkForVariablesToBeUpdated() {
        const refreshable = this.getRefreshableVariables();
        
        refreshable.sort((a, b) => (a.order > b.order) ? 1 : -1);

        const coilAddress = refreshable[0].key;
        const variable = this.variableInfo[coilAddress];
        console.log("Going to refresh", variable);

        this.issueReadRequest(coilAddress);

    }
        
    issueReadRequest(coilAddress) {
        const data = ModbusReadRequestMessage.create(coilAddress);

        const port = this.remotePort;
        const host = this.remoteHostname;

        console.log("issueReadRequest(" + coilAddress + ") to " + host + ":" + port + ", data:" + data.toString('hex'));
        this.server.send(data, 0, data.length, port, host);

    }

    handleVariableUpdate(coilAddress, value) {

        const variableInformation = this.getVariableInformation(coilAddress);
        if (!variableInformation) {
            console.error("Unknown coilAddress on incoming value:", coilAddress, "with value", value);
            return;
        }

        const scaled = Protocol.scaleNibeValue(variableInformation, value);

        variableInformation["lastUpdate"] = Date.now();

        this.emit('modbusUpdate', {
            coilAddress: coilAddress,
            value: value,
            scaled: scaled,
            name: variableInformation.name
        });
    }
};

exports.NibeHandler = NibeHandler;
