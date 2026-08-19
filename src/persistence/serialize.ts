export const SESSION_VERSION = "1.0.0";

export function serializeSession(session: object): string {
    // Convert session object to string
    console.log(`Serializing session: ${JSON.stringify(session)}`);
    return JSON.stringify(session); // Placeholder logic
}