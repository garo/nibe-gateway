"use strict";

const assert = require('chai').assert;
var dgram = require('dgram');

const NibeHandler = require('../lib/nibe/nibehandler.js').NibeHandler;

describe("nibe/handler", () => {
    it("shall exist", () => {     
        assert.isOk(NibeHandler);
    });

    it("should emit variable update events from a MODBUS_DATA_READ_OUT_MSG", function(done) {
        this.timeout(1000);
        
        const data = Buffer.from("5C00206850549C0901579CF101589CF0014C9C4C0122B82800C9AF0000449CCC00489CEE00599CF6005A9CFA004E9CF6014D9C0102619C0080ABA90000FAA904001C9DC80001A80E014CA80000569C0080FFFF000020", "hex");

        let nibe = new NibeHandler();
        nibe.on('modbusUpdate', (modbusUpdate) => {
            if (modbusUpdate.coilAddress == 40220 &&
                modbusUpdate.value == 200) {
                    nibe.close();
                    done();
            }
        })

        nibe.handleMessage(data);
    });

    it("should emit variable update events from a CMD_MODBUS_READ_RESP", function(done) {
        this.timeout(1000);
        
        const data = Buffer.from("5C00206A060102030405064B", "hex");

        let nibe = new NibeHandler();
        nibe.variableInfo = {
            "513" : {
                "factor": 10,
                "type": "sensor",
                "name": "Test signal 513",
                "datatype": "S32",
                "refresh": 30
            }
        };
        nibe.on('modbusUpdate', (modbusUpdate) => {
            if (modbusUpdate.coilAddress == 513 &&
                modbusUpdate.value == 100992003) {

                    // Verify that the lastUpdate timestamp has been updated within last 2 seconds
                    if (nibe.variableInfo["513"]["lastUpdate"] + 2000 > Date.now()) {
                        nibe.close();
                        done();
                    } else {
                        nibe.close();
                        done(new Error("lastUpdate timestamp was not updated in test"));
                    }
                }
            })

        nibe.handleMessage(data);
        
    });

    it("should just drop invalid messages", function() {
        let nibe = new NibeHandler();

        // This has invalid CRC
        nibe.handleMessage(Buffer.from("5C00206A060102030405064C", "hex"));
        nibe.close();
    });

    it("will know which variables needs to be refreshed", () => {
        let nibe = new NibeHandler();

        nibe.refreshList = {
            "513" : 30
        };
        nibe.variableInfo = {
            "513" : {
                "factor": 10,
                "type": "sensor",
                "name": "Test signal 513",
                "datatype": "S32",
                "refresh": 30
            }
        };
                    
        let refreshable = nibe.getRefreshableVariables();
        assert.equal(refreshable[0]["key"], "513");

        nibe.variableInfo["513"]["lastUpdate"] = Date.now() - 40000;
        refreshable = nibe.getRefreshableVariables();
        assert.equal(refreshable[0]["key"], "513");

        nibe.variableInfo["513"]["lastUpdate"] = Date.now() - 5000;
        refreshable = nibe.getRefreshableVariables();
        assert.equal(refreshable.length, 0);
        nibe.close();
    });

    it("can listen for udp messages", async function() {
        let nibe = new NibeHandler();
        nibe.variableInfo = {
            "513" : {
                "factor": 10,
                "type": "sensor",
                "name": "Test signal 513",
                "datatype": "S32",
                "refresh": 30
            }
        };
        let timeout = null;

        const p = new Promise((resolve, reject) => {
            nibe.on('modbusUpdate', (modbusUpdate) => {
                if (modbusUpdate.coilAddress == 513 &&
                    modbusUpdate.value == 100992003) {
                        nibe.close();
                        resolve();
                }
            });

            timeout = setTimeout(() => {
                reject("Timeout while waiting for update");
            }, 500);
        });

        let client = null;
        return nibe.listen()
            .then(port => {
                console.log("Listening on port", port);
                client = dgram.createSocket('udp4');
                const data = Buffer.from("5C00206A060102030405064B", "hex");
                client.send(data, 0, data.length, port, '127.0.0.1');
            })
            .then(() => {
                return p;
            })
            .then(() => {
                client.close();
                clearTimeout(timeout);
            });
    });

});
