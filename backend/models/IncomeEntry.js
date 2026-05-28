const mongoose = require('mongoose');

const incomeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Other'],
    required: true
  },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

incomeEntrySchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('IncomeEntry', incomeEntrySchema);
