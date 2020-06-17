const assert = require('chai').assert;

const Protocol = require('../lib/nibe/protocol.js');

describe("nibe/protocol", () => {
    it("shall exist", () => {     
        assert.isOk(Protocol);
    });

    it("can recognize MODBUS_DATA_READ_OUT_MSG", () => {    
        
        const data = Buffer.from("5C00206850549C0901579CF101589CF0014C9C4C0122B82800C9AF0000449CCC00489CEE00599CF6005A9CFA004E9CF6014D9C0102619C0080ABA90000FAA904001C9DC80001A80E014CA80000569C0080FFFF000020", "hex");

        const res = Protocol.isModbus40DataReadOut(data);
        assert.isOk(res);
    });

});
