export default function isEmptyObject(object: Object | undefined) {
  if (!object) {
    return undefined;
  }
  return Object.keys(object).length === 0;
}
