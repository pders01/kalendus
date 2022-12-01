export default function haveEqualValues(a: Object, b: Object) {
    Object.keys(a).length === Object.keys(b).length &&
    (Object.keys(a) as (keyof typeof a)[]).every((key) => {
      return (
        Object.prototype.hasOwnProperty.call(b, key) && b[key] === b[key]
      );
    });
}
