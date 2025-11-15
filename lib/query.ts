/**
 * Extracts and returns all query parameters from a Request object as a plain JS object.
 * 
 * @param {Request} req - The incoming Next.js Request object.
 * @returns {Record<string, string>} An object containing a key, value pair of all the query paramters and their values.
 */
export function readParams(req: Request): Record<string, string> {
    const url = new URL(req.url);
    return Object.fromEntries(url.searchParams.entries());
}