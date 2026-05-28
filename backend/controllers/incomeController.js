const IncomeEntry = require('../models/IncomeEntry');

exports.getAll = async (req, res) => {
  try {
    const entries = await IncomeEntry.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || amount == null || !category) {
    return res.status(400).json({ error: 'Title, amount, and category are required' });
  }

  try {
    const entry = await IncomeEntry.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  try {
    const entry = await IncomeEntry.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { title, amount: amount !== undefined ? parseFloat(amount) : undefined, category, date } },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Income entry not found' });
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await IncomeEntry.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!entry) {
      return res.status(404).json({ error: 'Income entry not found' });
    }
    res.json({ message: 'Income entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeAll = async (req, res) => {
  try {
    await IncomeEntry.deleteMany({ userId: req.user.id });
    res.json({ message: 'All income entries deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
