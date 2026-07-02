const { createToolRegistry } = require('./registry');
const { createRateLimiter } = require('./rateLimiter');

function createToolExecutor(env, repositories, profileStore) {
  const registry = createToolRegistry(repositories, profileStore);
  const rateLimiter = createRateLimiter({ maxPerMinute: 60 });

  let auditRepository = null;
  let activityLogsRepository = null;

  function setAuditRepositories(auditRepo, activityRepo) {
    auditRepository = auditRepo;
    activityLogsRepository = activityRepo;
  }

  async function execute(toolName, args, userId) {
    const startedAt = Date.now();
    const tool = registry.getTool(toolName);

    if (!tool) {
      return {
        tool: toolName,
        success: false,
        data: null,
        error: { code: 'UNKNOWN_TOOL', message: `Tool "${toolName}" does not exist. Available tools: ${Object.keys(registry.tools).join(', ')}` },
        executionMs: 0,
      };
    }

    const permCheck = registry.checkPermissions(toolName, userId);
    if (!permCheck.allowed) {
      await recordAudit(toolName, args, userId, false, 0, permCheck.reason);
      return {
        tool: toolName,
        success: false,
        data: null,
        error: { code: 'PERMISSION_DENIED', message: permCheck.reason },
        executionMs: Date.now() - startedAt,
      };
    }

    const rateCheck = rateLimiter.check(userId, toolName);
    if (!rateCheck.allowed) {
      const resetIn = Math.ceil(rateCheck.resetMs / 1000);
      await recordAudit(toolName, args, userId, false, 0, 'Rate limit exceeded');
      return {
        tool: toolName,
        success: false,
        data: null,
        error: { code: 'RATE_LIMITED', message: `Rate limit exceeded for ${toolName}. Try again in ${resetIn}s.`, retryAfterMs: rateCheck.resetMs },
        executionMs: Date.now() - startedAt,
      };
    }

    try {
      const result = await tool.execute(args, userId);
      const executionMs = Date.now() - startedAt;

      if (result.error) {
        await recordAudit(toolName, args, userId, false, executionMs, result.error.message);
        return {
          tool: toolName,
          success: false,
          data: null,
          error: result.error,
          executionMs,
        };
      }

      await recordAudit(toolName, args, userId, true, executionMs, null);
      return {
        tool: toolName,
        success: true,
        data: result.data || result,
        error: null,
        executionMs,
      };
    } catch (err) {
      const executionMs = Date.now() - startedAt;
      await recordAudit(toolName, args, userId, false, executionMs, err.message);
      return {
        tool: toolName,
        success: false,
        data: null,
        error: { code: 'TOOL_EXECUTION_ERROR', message: err.message },
        executionMs,
      };
    }
  }

  async function recordAudit(toolName, args, userId, success, executionMs, errorMessage) {
    try {
      if (activityLogsRepository?.create) {
        await activityLogsRepository.create({
          user_id: userId || null,
          activity_type: 'tool_execution',
          resource_type: 'ai_tool',
          description: `Tool ${toolName} ${success ? 'succeeded' : 'failed'}`,
          metadata: {
            tool: toolName,
            args: sanitizeArgs(args),
            success,
            executionMs,
            error: errorMessage || null,
          },
        });
      }
    } catch {
      // audit logging must never block tool execution
    }
  }

  function sanitizeArgs(args) {
    if (!args) return {};
    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    for (const key of sensitiveKeys) {
      if (sanitized[key]) sanitized[key] = '[REDACTED]';
    }
    return sanitized;
  }

  return {
    registry,
    rateLimiter,
    execute,
    setAuditRepositories,
  };
}

module.exports = { createToolExecutor };
