const canViewIssue = (user, issue) => {
  if (user.role === 'admin') return true
  if (user.role === 'reporter') {
    return issue.reporter.toString() === user._id.toString()
  }
  if (user.role === 'staff') {
    return Boolean(issue.department) && issue.department === user.department
  }
  return false
}

module.exports = { canViewIssue }