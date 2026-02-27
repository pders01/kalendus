export function catchError<T>(promise: Promise<T>): Promise<[undefined, T] | [Error]> {
    return promise
        .then((result) => [undefined, result] as [undefined, T])
        .catch((error) => [error] as [Error]);
}
