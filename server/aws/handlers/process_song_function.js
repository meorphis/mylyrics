import { processSong } from '/opt/nodejs/process_song.js';

export async function handler(event) {
    const {Records: records} = event;

    if (records.length !== 1) {
        // this function should be run on a queue with a batch size of 1
        return buildResponse(400, {error: "Invalid number of records"});
    }

    var args // {song, triggeredBy}
    try {
        const {body} = records[0];
        args = JSON.parse(body);
    } catch (e) {
        return buildResponse(400, {error: `Invalid JSON: "${body}"`});
    }

    try {
        await processSong(args);
    } catch (e) {
        return buildResponse(500, {message: "Unexpected error processing song", error: getErrorAsObject(e)});
    }
    return buildResponse(200, {});
}

const buildResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
        },
        body,
    };
}

const getErrorAsObject = (e) => {
    return {
        name: e.name,
        message: e.message,
        stack: e.stack,
    };
}