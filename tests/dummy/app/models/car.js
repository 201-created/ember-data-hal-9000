import DS from 'ember-data';

export default DS.Model.extend({
  make:   DS.attr('string'),
  model:  DS.attr('string'),
  wheels: DS.hasMany('wheel', {async:true}),
  owner: DS.belongsTo('owner', {async:true})
});
