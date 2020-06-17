"use strict";

const Protocol = require('./protocol');

const OFFSET_DATA = 5;


exports.decode = function(data) {
    if (!Protocol.isModbus40ReadResponse(data)) {
        throw new Protocol.ModbusProtocolError("Message is not a CMD_MODBUS_READ_RESP");
    }
    
    let rawMessage = Protocol.checkMessageChecksumAndRemoveDoubles(data);

    const coilAddress = rawMessage.readUInt16LE(OFFSET_DATA);
    
    const value = rawMessage.readInt32LE(OFFSET_DATA + 2);

    return {
        coilAddress: coilAddress,
        value: value
    }
};