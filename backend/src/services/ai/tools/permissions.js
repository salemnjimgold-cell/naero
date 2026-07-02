const PERMISSIONS = {
  READ_PLACES: 'read:places',
  READ_REVIEWS: 'read:reviews',
  READ_SAVED: 'read:saved_places',
  READ_NOTIFICATIONS: 'read:notifications',
  READ_PROFILE: 'read:profile',
  WRITE_REVIEWS: 'write:reviews',
  WRITE_SAVED: 'write:saved_places',
  WRITE_REPORTS: 'write:reports',
  WRITE_NOTIFICATIONS: 'write:notifications',
  WRITE_PROFILE: 'write:profile',
};

const PERMISSION_HIERARCHY = {
  [PERMISSIONS.READ_PLACES]: { type: 'read', resource: 'places', requiresAuth: false },
  [PERMISSIONS.READ_REVIEWS]: { type: 'read', resource: 'reviews', requiresAuth: false },
  [PERMISSIONS.READ_SAVED]: { type: 'read', resource: 'saved_places', requiresAuth: true, ownershipRequired: true },
  [PERMISSIONS.READ_NOTIFICATIONS]: { type: 'read', resource: 'notifications', requiresAuth: true, ownershipRequired: true },
  [PERMISSIONS.READ_PROFILE]: { type: 'read', resource: 'profile', requiresAuth: true, ownershipRequired: true },
  [PERMISSIONS.WRITE_REVIEWS]: { type: 'write', resource: 'reviews', requiresAuth: true, ownershipRequired: false },
  [PERMISSIONS.WRITE_SAVED]: { type: 'write', resource: 'saved_places', requiresAuth: true, ownershipRequired: true },
  [PERMISSIONS.WRITE_REPORTS]: { type: 'write', resource: 'reports', requiresAuth: true, ownershipRequired: false },
  [PERMISSIONS.WRITE_NOTIFICATIONS]: { type: 'write', resource: 'notifications', requiresAuth: true, ownershipRequired: false },
  [PERMISSIONS.WRITE_PROFILE]: { type: 'write', resource: 'profile', requiresAuth: true, ownershipRequired: true },
};

function checkToolPermission(permission, userId) {
  const rule = PERMISSION_HIERARCHY[permission];
  if (!rule) {
    return { allowed: false, reason: `Unknown permission: ${permission}` };
  }

  if (rule.requiresAuth && !userId) {
    return { allowed: false, reason: 'Authentication required for this operation.' };
  }

  return { allowed: true, reason: null };
}

function checkOwnership(permission, resourceUserId, authenticatedUserId) {
  const rule = PERMISSION_HIERARCHY[permission];
  if (!rule || !rule.ownershipRequired) return true;

  if (resourceUserId && authenticatedUserId && resourceUserId !== authenticatedUserId) {
    return false;
  }
  return true;
}

module.exports = {
  PERMISSIONS,
  PERMISSION_HIERARCHY,
  checkToolPermission,
  checkOwnership,
};
