import { processUsers } from '/opt/nodejs/process_users.js';

export async function handler() {
    try {
        await processUsers();
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
            body: JSON.stringify({message: "Unexpected error processing users", error: e}),
        };
    }
}