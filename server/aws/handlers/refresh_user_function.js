import { refreshUser } from '/opt/nodejs/refresh_user.js';

export async function handler(event) {
    const {Records: records} = event;

    if (records.length !== 1) {
        // this function should be run on a queue with a batch size of 1
        return buildResponse(400, {error: "Invalid number of records"});
    }

    var userId;
    var numRetries;
    var alwaysFeatureVeryTopArtist;
    try {
        const {body} = records[0];
        const json = JSON.parse(body);
        userId = json.userId;
        numRetries = json.numRetries ?? 0;
        alwaysFeatureVeryTopArtist = json.alwaysFeatureVeryTopArtist ?? false;
    } catch (e) {
        return buildResponse(400, {error: `Invalid JSON: "${records}"`});
    }

    try {
        await refreshUser({userId, numRetries, alwaysFeatureVeryTopArtist});
        return buildResponse(200, {});
    } catch (e) {
        return buildResponse(500, {message: "Unexpected error refreshing user", error: getErrorAsObject(e)});
    }
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