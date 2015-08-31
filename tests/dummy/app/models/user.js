import DS from 'ember-data';

let {attr} = DS;

export default DS.Model.extend({
  email: attr('string'),
  user_type: attr('string'),
  profile: attr(),
  _updated: attr('string'),
  _created: attr('string'),
  _etag: attr('string')
});
