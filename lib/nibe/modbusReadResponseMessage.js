"use strict";

const Protocol = require('./protocol');

const OFFSET_DATA = 5;


exports.decode = function(data, variableInfo) {
    if (!Protocol.isModbus40ReadResponse(data)) {
        throw new Protocol.ModbusProtocolError("Message is not a CMD_MODBUS_READ_RESP");
    }
    
    //console.log("Read resp message: " + data.slice(7).toString('hex'));

    let rawMessage = Protocol.checkMessageChecksumAndRemoveDoubles(data);

    const coilAddress = rawMessage.readUInt16LE(OFFSET_DATA);

    const info = variableInfo[coilAddress];

    let value = null;
    if (!info || info["datatype"] == "S16") { // Unknown type, assume that it's a S16
        value = rawMessage.readInt16LE(OFFSET_DATA + 2);
    } else if (info["datatype"] == "S32") {
        value = rawMessage.readInt32LE(OFFSET_DATA + 2);
    } else if (info["datatype"] == "U8") {
        value = rawMessage.readInt8(OFFSET_DATA + 2);
    }

    return {
        coilAddress: coilAddress,
        value: value
    }
};