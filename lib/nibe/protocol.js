"use strict";

// This code is heavily based on OpenHab Nibe heatpump binding
// which is originally written by Pauli Anttila <pauli.anttila@gmail.com>
// and licensed under Eclipse Public License 1.0
// 
// See: https://github.com/openhab/openhab-addons/tree/2.5.x/bundles/org.openhab.binding.nibeheatpump

const FRAME_START_CHAR_FROM_NIBE = 0x5C;
const FRAME_START_CHAR_TO_NIBE = 0xC0;

const OFFSET_START = 0;
const OFFSET_ADR = 2;
const OFFSET_CMD = 3;
const OFFSET_LEN = 4;
const OFFSET_DATA = 5;

const MESSAGE_TYPE_STRINGS = {
    0x62 : "CMD_RMU_DATA_MSG",
    0x68 : "CMD_MODBUS_DATA_MSG",
    0x69 : "CMD_MODBUS_READ_REQ",
    0x6A : "CMD_MODBUS_READ_RESP",
    0x6B : "CMD_MODBUS_WRITE_REQ",
    0x6C : "CMD_MODBUS_WRITE_RESP"
};

const CMD_RMU_DATA_MSG = 0x62;
const CMD_MODBUS_DATA_MSG = 0x68;
const CMD_MODBUS_READ_REQ = 0x69;
const CMD_MODBUS_READ_RESP = 0x6A;
const CMD_MODBUS_WRITE_REQ = 0x6B;
const CMD_MODBUS_WRITE_RESP = 0x6C;

const ADR_MODBUS40 = 0x20;

class ModbusProtocolError extends Error {}
exports.ModbusProtocolError = ModbusProtocolError;


exports.checkMessageChecksumAndRemoveDoubles = function(data) {
    let msglen;
    let startIndex;
    let stopIndex;

    if (exports.isModbus40ReadRequestPdu(data)
            || exports.isModbus40WriteRequestPdu(data)) {
        msglen = 3 + data[2];
        startIndex = 0;
        stopIndex = msglen;
    } else {
        msglen = 5 + data[OFFSET_LEN];
        startIndex = 2;
        stopIndex = msglen;
    }

    const checksum = exports.calculateChecksum(data, startIndex, stopIndex);
    const msgChecksum = data[msglen];

    // if checksum is 0x5C (start character), heat pump seems to send 0xC5 checksum
    if (checksum == msgChecksum || (checksum == FRAME_START_CHAR_FROM_NIBE && msgChecksum == 0xC5)) {

        // if data contains 0x5C (start character), data seems to contains double 0x5C characters

        // let's remove doubles
        for (let i = 1; i < msglen; i++) {
            if (data[i] == FRAME_START_CHAR_FROM_NIBE) {
                // NOTE: The following line is converted from java:
                // data = ArrayUtils.remove(data, i);
                data = Buffer.concat([data.slice(0, i), data.slice(i + 1)]);                
                msglen--;

                // fix message len
                data[OFFSET_LEN]--;
            }
        }
    } else {
        throw new ModbusProtocolError(
                "Checksum does not match. Checksum=" + (msgChecksum & 0xFF) + ", expected=" + (checksum & 0xFF));
    }

    return data;
};

exports.isModbus40DataReadOut = function(data) {
    if (data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE &&
        data[1] == 0x00 && data[OFFSET_ADR] == ADR_MODBUS40) {
            
        return data[OFFSET_CMD] == CMD_MODBUS_DATA_MSG && data[OFFSET_LEN] >= 0x50;
    }

    return false;
};

exports.isModbus40ReadResponse = function(data) {
    if (data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE &&
        data[1] == 0x00 && data[OFFSET_ADR] == ADR_MODBUS40) {

        return data[OFFSET_CMD] == CMD_MODBUS_READ_RESP && data[OFFSET_LEN] >= 0x06;
    }

    return false;
};

exports.isRmu40DataReadOut = function(data) {
    if (data[0] == FRAME_START_CHAR_FROM_NIBE &&
        data[1] == 0x00 && data[OFFSET_ADR] == ADR_RMU40) {

        return data[OFFSET_CMD] == CMD_RMU_DATA_MSG && data[OFFSET_LEN] >= 0x18;
    }

    return false;
};

exports.isModbus40WriteResponsePdu = function(data) {
    return data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE &&
        data[1] == 0x00 && data[OFFSET_ADR] == ADR_MODBUS40 &&
        data[OFFSET_CMD] == CMD_MODBUS_WRITE_RESP;
};

exports.isModbus40WriteTokenPdu = function(data) {
    return data[0] == FRAME_START_CHAR_FROM_NIBE && data[1] == 0x00 &&
        data[OFFSET_ADR] == ADR_MODBUS40 && data[OFFSET_CMD] == CMD_MODBUS_WRITE_REQ &&
        data[OFFSET_LEN] == 0x00;

};

exports.isModbus40ReadTokenPdu = function(data) {
    return data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE && data[1] == 0x00
        && data[OFFSET_ADR] == ADR_MODBUS40 && data[OFFSET_CMD] == CMD_MODBUS_READ_REQ
        && data[OFFSET_LEN] == 0x00;
};

exports.isModbus40WriteRequestPdu = function(data) {
    return data[0] == FRAME_START_CHAR_TO_NIBE && data[1] == CMD_MODBUS_WRITE_REQ;
};

exports.isModbus40ReadRequestPdu = function(data) {
    return data[OFFSET_START] == FRAME_START_CHAR_TO_NIBE && data[1] == CMD_MODBUS_READ_REQ;
};

exports.calculateChecksum = function(data, startIndex, stopIndex) {
    if (startIndex === undefined) {
        startIndex = 0;
    }

    if (stopIndex == undefined) {
        stopIndex = data.length;
    }

    let checksum = 0;
    // calculate XOR checksum
    for (let i = startIndex; i < stopIndex; i++) {
        checksum ^= data[i];
    }
    
    return checksum;
}

exports.getMessageType = function(data) {
    let messageType = 0;

    if (data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE) {
        messageType = data[OFFSET_CMD];
    } else if (data[OFFSET_START] == FRAME_START_CHAR_TO_NIBE) {
        messageType = data[1];
    }

    return messageType;
};

exports.getMessageTypeAsString = function(data) {
    let messageType = 0;

    if (data[OFFSET_START] == FRAME_START_CHAR_FROM_NIBE) {
        messageType = data[OFFSET_CMD];
    } else if (data[OFFSET_START] == FRAME_START_CHAR_TO_NIBE) {
        messageType = data[1];
    }

    if (MESSAGE_TYPE_STRINGS[messageType]) {
        return MESSAGE_TYPE_STRINGS[messageType];
    } else {
        return "UNKNOWN[" + messageType.toString(16) + "]";
    }
};

exports.scaleNibeValue = function(variableInformation, value) {
    const decimals = Math.log10(variableInformation.factor);

    const scaled = value / variableInformation.factor;

    return scaled;
}

