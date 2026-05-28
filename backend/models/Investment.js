const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  investmentName: { type: String, required: true },
  amount: { type: Number, required: true },
  type: {
    type: String,
    enum: ['Stocks', 'Mutual Funds', 'Crypto', 'Gold', 'SIP', 'Fixed Deposit'],
    required: true
  },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

investmentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Investment', investmentSchema);
