const { expect, assert } = require('chai').use(require('chai-bytes'));

const ModbusWriteRequestMessage = require('../lib/nibe/modbusWriteRequestMessage.js');

describe("nibe/modbusWriteRequestMessage", () => {
    it("shall exist", () => {     
        assert.isOk(ModbusWriteRequestMessage);
    });


    it("can create a MODBUS_WRITE_REQUEST_MSG message", () => {    
        
        const data = ModbusWriteRequestMessage.create(12345, 987654);

        expect(data).to.equalBytes("C06B06393006120F00BF");
    });

});
