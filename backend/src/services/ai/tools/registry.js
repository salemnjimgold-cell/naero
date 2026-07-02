const { checkToolPermission } = require('./permissions');

function createToolRegistry(repositories, profileStore) {
  const { createPlacesTools } = require('./places');
  const { createSavedPlacesTools } = require('./savedPlaces');
  const { createReviewsTools } = require('./reviews');
  const { createReportsTools } = require('./reports');
  const { createNotificationsTools } = require('./notifications');
  const { createProfileTools } = require('./profile');

  const toolGroups = [
    createPlacesTools(repositories),
    createSavedPlacesTools(repositories),
    createReviewsTools(repositories),
    createReportsTools(repositories),
    createNotificationsTools(repositories),
    createProfileTools(repositories, profileStore),
  ];

  const tools = {};
  for (const group of toolGroups) {
    for (const [name, tool] of Object.entries(group)) {
      tools[name] = tool;
    }
  }

  function getTool(name) {
    return tools[name] || null;
  }

  function getAllTools() {
    const result = {};
    for (const [name, tool] of Object.entries(tools)) {
      result[name] = {
        description: tool.description,
        parameters: tool.parameters,
        permissions: tool.permissions,
        rateLimit: tool.rateLimit,
      };
    }
    return result;
  }

  function getToolDefinitions() {
    const defs = [];
    for (const [name, tool] of Object.entries(tools)) {
      defs.push({
        type: 'function',
        function: {
          name,
          description: tool.description,
          parameters: tool.parameters,
        },
      });
    }
    return defs;
  }

  function checkPermissions(toolName, userId) {
    const tool = tools[toolName];
    if (!tool) {
      return { allowed: false, reason: `Unknown tool: ${toolName}` };
    }

    for (const permission of tool.permissions) {
      const result = checkToolPermission(permission, userId);
      if (!result.allowed) {
        return result;
      }
    }

    return { allowed: true, reason: null };
  }

  return {
    tools,
    getTool,
    getAllTools,
    getToolDefinitions,
    checkPermissions,
  };
}

module.exports = { createToolRegistry };
