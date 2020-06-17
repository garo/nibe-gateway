const { expect, assert } = require('chai').use(require('chai-bytes'));

const ModbusReadRequestMessage = require('../lib/nibe/modbusReadRequestMessage.js');

describe("nibe/modbusReadRequestMessage", () => {
    it("shall exist", () => {     
        assert.isOk(ModbusReadRequestMessage);
    });


    it("can create a CMD_MODBUS_READ_REQ message", () => {    
        
        const data = ModbusReadRequestMessage.create(12345);

        expect(data).to.equalBytes("C069023930A2");
    });

});
