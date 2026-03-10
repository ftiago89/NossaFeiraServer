const { Schema, model } = require('mongoose');

const ExampleSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

const ExampleModel = model('example', ExampleSchema);

module.exports = ExampleModel;
