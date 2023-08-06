import { swapSpotifyCode } from '/opt/nodejs/swap_spotify_code.js';
import { URLSearchParams } from 'url';

export async function handler(event) {
    try {
        const { body, httpMethod, queryStringParameters } = event;
        if (httpMethod !== 'POST') {
            return buildResponse(400, {error: `Unsupported method "${httpMethod}"`});                
        }

        let bodyParams;
        try {
            bodyParams = new URLSearchParams(body);
        } catch (e) {
            return buildResponse(400, {error: `Invalid request body: "${body}"`});
        }

        // react-native-spotify-remote constructs the request and because we can only pass that library a URL, we
        // end up needing to pass the userId as a query parameter, whereas the library passes the code in the
        // request body - that is why the parameters are split up like this
        const {userId} = queryStringParameters;
        const code = bodyParams.get('code');
        
        if (!userId || !code) {
            return buildResponse(400, {error: `Request must include userId as a query parameter and code in the request body`});
        }

        const {status, data} = await swapSpotifyCode({userId, code});
        return buildResponse(status, data);
    } catch (e) {
        return buildResponse(500, {message: "Unexpected error swapping spotify code", error: getErrorAsObject(e)});
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