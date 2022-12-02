export default function isEmptyObjectOrUndefined(object) {
    if (!object) {
        return true;
    }
    return Object.keys(object).length === 0;
}
//# sourceMappingURL=isEmptyObjectOrUndefined.js.map