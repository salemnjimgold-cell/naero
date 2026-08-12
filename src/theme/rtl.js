function logicalEdge(isRTL, startValue, endValue) {
  return isRTL ? { left: endValue, right: startValue } : { left: startValue, right: endValue };
}

function logicalMargin(isRTL, start = 0, end = 0) {
  const edge = logicalEdge(isRTL, start, end);
  return { marginLeft: edge.left, marginRight: edge.right };
}

function logicalPadding(isRTL, start = 0, end = 0) {
  const edge = logicalEdge(isRTL, start, end);
  return { paddingLeft: edge.left, paddingRight: edge.right };
}

function shouldMirrorIcon(iconKind) {
  return ['back', 'forward', 'chevron', 'undo', 'redo'].includes(iconKind);
}

module.exports = { logicalEdge, logicalMargin, logicalPadding, shouldMirrorIcon };
