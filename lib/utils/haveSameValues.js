export default function haveSameValues(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    return Object.entries(a).every(([key, value]) => {
        // Check if the key exists in both objects and if the type of the value for the key is the same
        if (key in a && key in b && typeof a[key] === typeof b[key]) {
            // Compare the values of the key in both objects
            return value === b[key];
        }
        return false;
    });
}
//# sourceMappingURL=haveSameValues.js.map