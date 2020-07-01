"use strict";

const Protocol = require('./protocol');

const FRAME_START_CHAR_FROM_NIBE = 0x5C;
const FRAME_START_CHAR_TO_NIBE = 0xC0;

const OFFSET_START = 0;
const OFFSET_ADR = 2;
const OFFSET_CMD = 3;
const OFFSET_LEN = 4;
const OFFSET_DATA = 5;

const CMD_RMU_DATA_MSG = 0x62;
const CMD_MODBUS_DATA_MSG = 0x68;
const CMD_MODBUS_READ_REQ = 0x69;
const CMD_MODBUS_READ_RESP = 0x6A;
const CMD_MODBUS_WRITE_REQ = 0x6B;
const CMD_MODBUS_WRITE_RESP = 0x6C;

const ADR_MODBUS40 = 0x20;

exports.create = function(coilAddress, value) {

    const data = Buffer.alloc(10);

    data.writeUInt8(FRAME_START_CHAR_TO_NIBE, 0);
    data.writeUInt8(CMD_MODBUS_WRITE_REQ, 1);
    data.writeUInt8(0x06, 2); // data length
    data.writeUInt16LE(coilAddress, 3);
    data.writeUInt32LE(value, 5);
    data.writeUInt8(Protocol.calculateChecksum(data, 0, 9), 9); // data length
    
    return data;
};
