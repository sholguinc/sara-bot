// Filter the keys of and objet
export function filterKeys(object: object, allowedKeys: string[]) {
  const keys = Object.keys(object);

  const filteredKeys = keys.filter((key) => allowedKeys.includes(key));

  return filteredKeys.reduce((obj, key) => {
    obj[key] = object[key];
    return obj;
  }, {});
}
