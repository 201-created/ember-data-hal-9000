export default function modelName(modelClass) {
  if (modelClass.modelName) {
    return modelClass.modelName;
  } else {
    // prior to ember-data 1.0.0-beta.18
    return modelClass.typeKey;
  }
}
