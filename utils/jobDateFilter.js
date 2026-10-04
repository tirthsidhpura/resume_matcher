function parseJobDate(value) {
  const normalized = /^\d{8}$/.test(value)
    ? `${value.slice(4)}-${value.slice(2, 4)}-${value.slice(0, 2)}`
    : value;
  const start = new Date(`${normalized}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
      !Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== normalized) {
    const error = new Error("Date must be a valid YYYY-MM-DD or DDMMYYYY date");
    error.status = 400;
    throw error;
  }
  return {
    selectedDate: normalized,
    filter: { createdAt: { $gte: start, $lt: new Date(start.getTime() + 86400000) } },
  };
}

async function getDashboardDateFilter(Job, date) {
  if (date !== undefined) {
    if (typeof date !== "string") return parseJobDate("");
    return parseJobDate(date);
  }
  const latest = await Job.findOne().sort({ createdAt: -1 }).select("createdAt").lean();
  if (!latest) return { selectedDate: "", filter: { _id: { $in: [] } } };
  return parseJobDate(new Date(latest.createdAt).toISOString().slice(0, 10));
}

module.exports = { parseJobDate, getDashboardDateFilter };
