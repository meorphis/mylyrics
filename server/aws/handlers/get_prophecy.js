import { getProphecy } from '/opt/nodejs/get_prophecy.js';

export async function handler(event) {
    try {
        const { httpMethod, body } = event;

        if (httpMethod !== 'POST') {
            return buildResponse(400, {error: `Unsupported method "${httpMethod}"`});                
        }

        const bodyObject = JSON.parse(body);
        const {userId, passages} = bodyObject
        
        if (!userId || !passages) {
            return buildResponse(400, {error: `Request must include userId and passages in the body`});
        }

        const prophecy = await getProphecy({userId, passages});
        return buildResponse(200, JSON.stringify({prophecy}));
    } catch (e) {
        return buildResponse(500, {message: "Unexpected error getting prophecy", error: getErrorAsObject(e)});
    }
}

const getErrorAsObject = (e) => {
    return {
        name: e.name,
        message: e.message,
        stack: e.stack,
    };
}

const buildResponse = (statusCode, body) => {
    if (statusCode !== 400 && statusCode !== 200) {
        // do not surface the actual body of internal server errors to the client
        console.log(`server error with body ${JSON.stringify(body)}`);
        body = "an unknown error occurred";
    }

    return {
        statusCode,
        headers: {
            "Content-Type": "application/json",
        },
        body,
    };
}