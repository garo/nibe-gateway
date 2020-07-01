const { expect, assert } = require('chai').use(require('chai-bytes'));

const ModbusWriteResponseMessage = require('../lib/nibe/modbusWriteResponseMessage.js');
const Protocol = require('../lib/nibe/protocol.js');

describe("nibe/modbusWriteResponseMessage", () => {
    it("shall exist", () => {     
        assert.isOk(ModbusWriteResponseMessage);
    });

    it("can decode a CMD_MODBUS_WRITE_RESP successful message", () => {
        const data = Buffer.from("5C00206C01014C", "hex");
        const ok = ModbusWriteResponseMessage.decode(data);
        assert.equal(ok, true);
    });

    it("can decode a CMD_MODBUS_WRITE_RESP failed message", () => {
        const data = Buffer.from("5C00206C01004D", "hex");
        const ok = ModbusWriteResponseMessage.decode(data);
        assert.equal(ok, false);
    });

    it("will raise error on bad CRC", () => {    
        const data = Buffer.from("5C00206C01004A", "hex");
        expect(() => {
            ModbusWriteResponseMessage.decode(data, {});
        }).to.throw(Protocol.ModbusProtocolError);      
    });

    it("will raise error on invalid message type", () => {    
        const data = Buffer.from("5C00206B060102030405064A", "hex");
        expect(() => {
            ModbusWriteResponseMessage.decode(data);
        }).to.throw(Protocol.ModbusProtocolError);      
    });

});
