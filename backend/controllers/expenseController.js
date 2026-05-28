const Expense = require('../models/Expense');

exports.getAll = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(expenses);
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
    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      category,
      date: date || new Date().toISOString().split('T')[0]
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { title, amount, category, date } = req.body;

  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { title, amount: amount !== undefined ? parseFloat(amount) : undefined, category, date } },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const expense = await Expense.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeAll = async (req, res) => {
  try {
    await Expense.deleteMany({ userId: req.user.id });
    res.json({ message: 'All expenses deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
