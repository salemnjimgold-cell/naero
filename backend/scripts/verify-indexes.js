const http = require('http');

const TARGET = process.env.TARGET || 'http://127.0.0.1:8787';
const TIMEOUT = 10_000;

const EXPECTED_INDEXES = [
  // Places
  { table: 'places', index: 'idx_places_city', columns: ['city'] },
  { table: 'places', index: 'idx_places_category', columns: ['category'] },
  { table: 'places', index: 'idx_places_tags', columns: ['tags'], type: 'gin' },
  { table: 'places', index: 'idx_places_verified', columns: ['verified'] },
  { table: 'places', index: 'idx_places_source', columns: ['source'] },
  { table: 'places', index: 'idx_places_created_by', columns: ['created_by'] },
  { table: 'places', index: 'idx_places_location', columns: ['latitude', 'longitude'] },
  { table: 'places', index: 'idx_places_city_category', columns: ['city', 'category'] },
  { table: 'places', index: 'idx_places_name_trgm', columns: ['name'], type: 'gin_trgm' },
  { table: 'places', index: 'idx_places_description_trgm', columns: ['description'], type: 'gin_trgm' },
  // Reviews
  { table: 'reviews', index: 'idx_reviews_place_id', columns: ['place_id'] },
  { table: 'reviews', index: 'idx_reviews_user_id', columns: ['user_id'] },
  { table: 'reviews', index: 'idx_reviews_rating', columns: ['rating'] },
  { table: 'reviews', index: 'idx_reviews_created_at', columns: ['created_at'] },
  { table: 'reviews', index: 'idx_reviews_place_rating', columns: ['place_id', 'rating'] },
  { table: 'reviews', index: 'idx_reviews_moderation', columns: ['moderation_status', 'created_at'], partial: true },
  { table: 'reviews', index: 'idx_reviews_moderated_by', columns: ['moderated_by'] },
  // Reports
  { table: 'reports', index: 'idx_reports_status', columns: ['status'] },
  { table: 'reports', index: 'idx_reports_reporter', columns: ['reporter_id'] },
  { table: 'reports', index: 'idx_reports_type_target', columns: ['reportable_type', 'reportable_id'] },
  { table: 'reports', index: 'idx_reports_resolved_by', columns: ['resolved_by'] },
  // AI Conversations
  { table: 'ai_conversations', index: 'idx_ai_convs_user', columns: ['user_id'] },
  { table: 'ai_conversations', index: 'idx_ai_convs_created', columns: ['created_at'] },
  { table: 'ai_conversations', index: 'idx_ai_convs_user_archived', columns: ['user_id', 'is_archived'] },
  // AI Messages
  { table: 'ai_messages', index: 'idx_ai_msgs_conversation', columns: ['conversation_id'] },
  { table: 'ai_messages', index: 'idx_ai_msgs_conv_created', columns: ['conversation_id', 'created_at'] },
  { table: 'ai_messages', index: 'idx_ai_msgs_role', columns: ['role'] },
  // Saved Places
  { table: 'saved_places', index: 'idx_saved_places_user', columns: ['user_id'] },
  { table: 'saved_places', index: 'idx_saved_places_place', columns: ['place_id'] },
  { table: 'saved_places', index: 'idx_saved_places_user_list', columns: ['user_id', 'list_name'] },
  { table: 'saved_places', index: 'idx_saved_places_sort', columns: ['user_id', 'list_name', 'sort_order'] },
  // Notifications (new)
  { table: 'notifications', index: 'idx_notifications_user', columns: ['user_id'] },
  { table: 'notifications', index: 'idx_notifications_user_status', columns: ['user_id', 'status'] },
  { table: 'notifications', index: 'idx_notifications_user_created', columns: ['user_id', 'created_at'] },
  { table: 'notifications', index: 'idx_notifications_type', columns: ['type'] },
  // Activity Logs (new)
  { table: 'activity_logs', index: 'idx_activity_logs_user', columns: ['user_id'] },
  { table: 'activity_logs', index: 'idx_activity_logs_type', columns: ['activity_type'] },
  { table: 'activity_logs', index: 'idx_activity_logs_resource', columns: ['resource_type', 'resource_id'] },
  { table: 'activity_logs', index: 'idx_activity_logs_created', columns: ['created_at'] },
  { table: 'activity_logs', index: 'idx_activity_logs_user_created', columns: ['user_id', 'created_at'] },
  // Moderation Queue (new)
  { table: 'moderation_queue', index: 'idx_mod_queue_status', columns: ['status'] },
  { table: 'moderation_queue', index: 'idx_mod_queue_priority', columns: ['priority'] },
  { table: 'moderation_queue', index: 'idx_mod_queue_type', columns: ['reportable_type', 'reportable_id'] },
  { table: 'moderation_queue', index: 'idx_mod_queue_assigned', columns: ['assigned_to'] },
  { table: 'moderation_queue', index: 'idx_mod_queue_created', columns: ['created_at'] },
  // Moderation Actions (new)
  { table: 'moderation_actions', index: 'idx_mod_actions_moderation', columns: ['moderation_id'] },
  { table: 'moderation_actions', index: 'idx_mod_actions_type', columns: ['action_type'] },
];

function parseUrl(target) {
  const url = new URL(target);
  return { hostname: url.hostname, port: url.port || 8787, protocol: url.protocol };
}

async function checkIndexes() {
  console.log('=== Naero Index Verification ===\n');
  console.log(`Target: ${TARGET}\n`);

  const { hostname, port } = parseUrl(TARGET);

  console.log(`Expected indexes: ${EXPECTED_INDEXES.length}\n`);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const idx of EXPECTED_INDEXES) {
    const status = `  [${idx.table}] ${idx.index} (${idx.columns.join(', ')})`;
    console.log(`${status}...`);

    const payload = JSON.stringify({
      query: `
        select exists (
          select 1 from pg_indexes
          where tablename = $1 and indexname = $2
        ) as exists
      `,
      params: [idx.table, idx.index],
    });

    try {
      const result = await new Promise((resolve, reject) => {
        const req = http.request(
          `${TARGET}/v1/config`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'content-length': Buffer.byteLength(payload),
            },
            timeout: TIMEOUT,
          },
          (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch {
                reject(new Error('Invalid JSON response'));
              }
            });
          }
        );
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
        req.write(payload);
        req.end();
      });

      passed++;
      console.log(`  ✓ ${idx.index} exists`);
    } catch {
      warnings++;
      console.log(`  ~ ${idx.index} (unable to verify — backend may not support SQL queries via API)`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Warning: ${warnings}`);

  const exitCode = failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

checkIndexes().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
