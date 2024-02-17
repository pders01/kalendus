export default function haveSameValues<T1 extends object, T2 extends object>(
    a: T1,
    b: T2,
): boolean {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }

    return Object.entries(a).every(([key, value]) => {
        // Check if the key exists in both objects and if the type of the value for the key is the same
        if (
            key in a &&
            key in b &&
            typeof a[key as keyof T1] === typeof b[key as keyof T2]
        ) {
            // Compare the values of the key in both objects
            return value === b[key as keyof T2];
        }

        return false;
    });
}
