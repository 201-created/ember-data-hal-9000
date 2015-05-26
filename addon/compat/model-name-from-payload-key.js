export default function getModelNameFromPayloadKey(serializer, key) {
  if (typeof serializer.modelNameFromPayloadKey === 'function') {
    return serializer.modelNameFromPayloadKey(key);
  } else {
    // prior to ember-data 1.0.0-beta.18
    return serializer.typeForRoot(key);
  }
}
