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


exports.decode = function(data) {
    let rawMessage = Protocol.checkMessageChecksumAndRemoveDoubles(data);
    let msgId = data[1];

    const msglen = 5 + rawMessage[OFFSET_LEN];

    const values = {};

    for (let i = OFFSET_DATA; i < (msglen - 1); i += 4) {
        let id = ((rawMessage[i + 1] & 0xFF) << 8 | (rawMessage[i + 0] & 0xFF));
        let value = ((rawMessage[i + 3] & 0xFF) << 8 | (rawMessage[i + 2] & 0xFF));

        // This trick casts to a "short" like number.
        // See https://stackoverflow.com/questions/50179214/how-to-convert-an-integer-to-short-in-javascript
        value = (value << 16) >> 16;

        if (id != 0xFFFF) {
            values[id] = value;
        }
    }

    return values;

};

