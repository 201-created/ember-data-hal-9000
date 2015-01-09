import DS from 'ember-data';

export default DS.Model.extend({
  hasSnowChains: DS.attr('boolean'),
  car: DS.belongsTo('car', {async:true}),
  lugnuts: DS.hasMany('lugnut', {async:true})
});
