import { processUsers } from '/opt/nodejs/process_users.js';

export async function handler(event) {
    const timestampStr = event.time;
    const timestamp = new Date(timestampStr);
    const minute = timestamp.getUTCMinutes();

    try {
        await processUsers({minute});
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
            },
            body: {message: "Unexpected error processing users", error: getErrorAsObject(e)},
        };
    }
}

const getErrorAsObject = (e) => {
    return {
        name: e.name,
        message: e.message,
        stack: e.stack,
    };
}