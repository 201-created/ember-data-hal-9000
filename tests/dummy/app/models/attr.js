import DS from 'ember-data';

export default DS.Model.extend({
  admin: DS.attr('boolean'),
  occupation: DS.attr('string')
});
