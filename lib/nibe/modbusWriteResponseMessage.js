"use strict";

const Protocol = require('./protocol');

const OFFSET_DATA = 5;


exports.decode = function(data) {
    if (!Protocol.isModbus40WriteResponsePdu(data)) {
        throw new Protocol.ModbusProtocolError("Message is not a CMD_MODBUS_WRITE_RESP");
    }
    
    Protocol.checkMessageChecksumAndRemoveDoubles(data);

    return data.readUInt8(OFFSET_DATA) == 0x01;

};