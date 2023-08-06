import { getAdditionalRecommendations } from '/opt/nodejs/get_additional_recommendations.js';
import { URLSearchParams } from 'url';

export async function handler(event) {
    try {
        const { httpMethod, queryStringParameters } = event;
        if (httpMethod !== 'GET') {
            return buildResponse(400, {error: `Unsupported method "${httpMethod}"`});                
        }

        const {userId, sentiment} = queryStringParameters || {};
        
        if (!userId || !sentiment) {
            return buildResponse(400, {error: `Request must include userId and sentiment as query parameters`});
        }

        const recommendations = await getAdditionalRecommendations({userId, sentiment});
        return buildResponse(200, JSON.stringify({recommendations}));
    } catch (e) {
        return buildResponse(500, {message: "Unexpected error get recommendations", error: getErrorAsObject(e)});
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