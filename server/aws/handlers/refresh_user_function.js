import { refreshUser } from '/opt/nodejs/refresh_user.js';

export async function handler(event) {
    const {Records: records} = event;

    if (records.length !== 1) {
        // this function should be run on a queue with a batch size of 1
        return buildResponse(400, {error: "Invalid number of records"});
    }

    var userId;
    var numRetries;
    try {
        const {body} = records[0];
        const json = JSON.parse(body);
        userId = json.userId;
        numRetries = json.numRetries;
        alwaysFeatureVeryTopUser = json.alwaysFeatureVeryTopUser;
    } catch (e) {
        return buildResponse(400, {error: `Invalid JSON: "${body}"`});
    }

    try {
        await refreshUser({userId, numRetries, alwaysFeatureVeryTopUser});
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