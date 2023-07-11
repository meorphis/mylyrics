import { processSong } from '/opt/nodejs/process_song.js';

export async function handler(event) {
    const {Records: records} = event;

    if (records.length !== 1) {
        // this function should be run on a queue with a batch size of 1
        return buildResponse(400, {error: "Invalid number of records"});
    }

    const {body} = records[0];
    const {songName, artistName} = JSON.parse(body);

    await processSong({songName, artistName});
    return buildResponse(200, {});
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