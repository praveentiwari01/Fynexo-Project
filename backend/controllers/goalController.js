const Goal = require('../models/Goal');

exports.getAll = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { name, targetAmount, currentAmount, deadline } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({ error: 'Name and target amount are required' });
  }

  try {
    const goal = await Goal.create({
      userId: req.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
      deadline: deadline || null
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, targetAmount, currentAmount, deadline } = req.body;

  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: { name, targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : undefined, currentAmount: currentAmount !== undefined ? parseFloat(currentAmount) : undefined, deadline } },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const goal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.removeAll = async (req, res) => {
  try {
    await Goal.deleteMany({ userId: req.user.id });
    res.json({ message: 'All goals deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
