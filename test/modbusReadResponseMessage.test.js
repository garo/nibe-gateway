const { expect, assert } = require('chai').use(require('chai-bytes'));

const ModbusReadResponseMessage = require('../lib/nibe/modbusReadResponseMessage.js');
const Protocol = require('../lib/nibe/protocol.js');

describe("nibe/modbusReadResponseMessage", () => {
    it("shall exist", () => {     
        assert.isOk(ModbusReadResponseMessage);
    });


    it("can decode a CMD_MODBUS_READ_RESP message", () => {
        
        const data = Buffer.from("5C00206A060102030405064B", "hex");
        const res = ModbusReadResponseMessage.decode(data, {});

        assert(res.coilAddress, 513);
        assert(res.value, 100992003);

    });

    it("will raise error on bad CRC", () => {    
        const data = Buffer.from("5C00206A060102030405064C", "hex");
        expect(() => {
            ModbusReadResponseMessage.decode(data, {});
        }).to.throw(Protocol.ModbusProtocolError);      
    });

    it("will raise error on invalid message type", () => {    
        const variableInfo = {
            "513" : {}
        }
        const data = Buffer.from("5C00206B060102030405064A", "hex");
        expect(() => {
            ModbusReadResponseMessage.decode(data);
        }).to.throw(Protocol.ModbusProtocolError);      
    });

});
