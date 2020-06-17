const assert = require('chai').assert;

const ModbusDataReadOutMessage = require('../lib/nibe/modbusDataReadOutMessage.js');

describe("nibe/modbusDataReadOutMessage", () => {
    it("shall exist", () => {     
        assert.isOk(ModbusDataReadOutMessage);
    });


    it("can decode MODBUS_DATA_READ_OUT_MSG", () => {    
        
        const data = Buffer.from("5C00206850549C0901579CF101589CF0014C9C4C0122B82800C9AF0000449CCC00489CEE00599CF6005A9CFA004E9CF6014D9C0102619C0080ABA90000FAA904001C9DC80001A80E014CA80000569C0080FFFF000020", "hex");
        
        const res = ModbusDataReadOutMessage.decode(data);
        assert.isOk(res);
        assert.equal(res[40020], 265);
        assert.equal(res[40023], 497);
        assert.equal(res[40024], 496);
        assert.equal(res[40012], 332);
        assert.equal(res[47138], 40);
        assert.equal(res[45001], 0);
        assert.equal(res[40004], 204);
        assert.equal(res[40008], 238);
        assert.equal(res[40025], 246);
        assert.equal(res[40026], 250);
        assert.equal(res[40014], 502);
        assert.equal(res[40013], 513);
        assert.equal(res[40033], -32768);
        assert.equal(res[43435], 0);
        assert.equal(res[43514], 4);
        assert.equal(res[40220], 200);
        assert.equal(res[43009], 270);
        assert.equal(res[43084], 0);
        assert.equal(res[40022], -32768);
    });

});
