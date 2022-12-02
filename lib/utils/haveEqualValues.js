export default function haveEqualValues(a, b) {
    if (!(a && b)) {
        return false;
    }
    Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every((key) => {
            return (Object.prototype.hasOwnProperty.call(b, key) && b[key] === b[key]);
        });
}
//# sourceMappingURL=haveEqualValues.js.map