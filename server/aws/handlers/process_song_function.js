import { processSong } from '/opt/nodejs/process_song.js';

export async function handler(event) {
    const {Records: records} = event;

    if (records.length !== 1) {
        // this function should be run on a queue with a batch size of 1
        return buildResponse(400, {error: "Invalid number of records"});
    }

    try {
        const {body} = records[0];
        const {songName, artistName} = JSON.parse(body);
        try {
            await processSong({songName, artistName});
            return buildResponse(200, {});
        } catch (e) {
            return buildResponse(500, {message: "Unexpected error processing song", error: e});
        }
    } catch (e) {
        return buildResponse(400, {message: "Invalid record body", error: e});
    }
}

const buildResponse = (statusCode, body) => {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    };
}