const Investment = require('../models/Investment');

exports.getAll = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { investmentName, amount, type, date } = req.body;

  if (!investmentName || amount == null || !type) {
    return res.status(400).json({ error: 'Investment name, amount, and type are required' });
  }

  try {
    const investment = await Investment.create({
      userId: req.user.id,
      investmentName,
      amount: parseFloat(amount),
      type,
      date: date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(investment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const investment = await Investment.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeAll = async (req, res) => {
  try {
    await Investment.deleteMany({ userId: req.user.id });
    res.json({ message: 'All investments deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
