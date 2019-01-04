import { underscore } from '@ember/string';
import HalSerializer from "ember-data-hal-9000/serializer";

export default HalSerializer.extend({
  keyForRelationship(key) {
    return underscore(key);
  }
});
