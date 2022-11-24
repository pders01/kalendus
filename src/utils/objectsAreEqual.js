function isObject(object) {
  return object !== null && typeof object === 'object';
}

export default function objectsAreEqual(a, b) {
  const propertiesA = Object.getOwnPropertyNames(a);
  const propertiesB = Object.getOwnPropertyNames(b);
  
  if (propertiesA.length !== propertiesB.length) { return false; }
  
  for (let i = 0; i < propertiesA.length; i += 1) {
    let valueA = a[propertiesA[i]];
    let valueB = b[propertiesB[i]];
    let areObjects = isObject(valueA) && isObject(valueB);
    if (areObjects && !objectsAreEqual(valueA, valueB) || !areObjects && valueA !== valueB) { return false; }
  }
  return true;
}

