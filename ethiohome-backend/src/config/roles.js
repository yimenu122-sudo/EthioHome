/**
 * @file roles.js
 * @description Central Role Definitions (RBAC Core) for EthioHome
 * @author Senior Node.js Developer
 * 
 * EthioHome is role-driven. This file centralizes all roles and their 
 * fundamental permissions to avoid hardcoding strings throughout the app.
 */

const ROLES = {
  RENTER: 'Renter',
  BUYER: 'Buyer',
  OWNER: 'Owner',
  AGENT: 'Agent',
  ADMIN: 'Admin'
};

/**
 * ROLE HIERARCHY / PERMISSIONS
 * Defines what each role is fundamentally allowed to do
 */
const ROLE_PERMISSIONS = {
  [ROLES.RENTER]: [
    'view_properties',
    'search_properties',
    'create_bookings',
    'view_own_profile',
    'chat_with_agent'
  ],
  [ROLES.BUYER]: [
    'view_properties',
    'search_properties',
    'view_own_profile',
    'create_purchase_offer',
    'chat_with_agent'
  ],
  [ROLES.OWNER]: [
    'create_property',
    'manage_own_properties',
    'view_offers',
    'manage_own_profile',
    'chat_with_agent'
  ],
  [ROLES.AGENT]: [
    'create_property',
    'manage_assigned_properties',
    'manage_clients',
    'manage_own_profile',
    'chat_with_all'
  ],
  [ROLES.ADMIN]: [
    'manage_system',
    'manage_users',
    'manage_all_properties',
    'view_reports',
    'manage_settings',
    'audit_logs'
  ]
};

/**
 * HELPER: Get all roles as an array for validation
 */
const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  ALL_ROLES
};
