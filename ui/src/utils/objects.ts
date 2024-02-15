function recurse(obj: Record<string, any>, keys: string[], currPath: string) {
  if (obj && !(obj instanceof Array) && typeof obj == "object") {
    Object.keys(obj).forEach((key) => {
      const nestedPath = currPath ? currPath + "." + key : key;
      keys.push(nestedPath);
      recurse(obj[key], keys, nestedPath);
    });
  }
}

function getNestedKeys(obj: Record<string, any>): string[] {
  const keys: string[] = [];
  recurse(obj, keys, "");
  return keys;
}

function parseJSON<TReturn>(text: string): TReturn | null {
  if (text == null) {
    return null;
  }

  if (text.at(0) === '"' && text.at(-1) === '"') {
    text = text.slice(1, -1);
  }

  try {
    const obj = JSON.parse(text) as TReturn;
    return obj;
  } catch {
    return null;
  }
}

const objectsUtils = {
  getNestedKeys,
  parseJSON,
};

export default objectsUtils;
