/**
 * 清理预置的 6 个默认任务分类
 * 用法（服务器上）：node scripts/clear-seed-categories.js
 * 注意：不要加 --env-file，直接用 db.js 内置的服务器凭据
 *
 * 只删除：种子前缀匹配 且 名下没有任何任务 的分类（安全，可重复执行）
 */
const db = require('../config/db');

const SEED_PREFIXES = ['YJCSJ', 'YJMD', 'CRSMS', 'PPMDT', 'CRBCJG', 'PPCX'];

async function clear() {
  try {
    console.log('🧹 开始清理预置任务分类...\n');

    const placeholders = SEED_PREFIXES.map(() => '?').join(',');
    const [cats] = await db.query(
      `SELECT c.id, c.name, c.code_prefix, COUNT(t.id) AS task_count
       FROM task_categories c
       LEFT JOIN tasks t ON t.category_id = c.id
       WHERE c.code_prefix IN (${placeholders})
       GROUP BY c.id`,
      SEED_PREFIXES
    );

    if (cats.length === 0) {
      console.log('⏭️  没有找到预置分类，可能已清理过');
      process.exit(0);
    }

    let deleted = 0, kept = 0;
    for (const c of cats) {
      if (c.task_count > 0) {
        console.log(`  ⚠️  「${c.name}」(${c.code_prefix}) 下还有 ${c.task_count} 个任务，保留不删`);
        kept++;
        continue;
      }
      await db.query('DELETE FROM task_categories WHERE id = ?', [c.id]);
      console.log(`  ✅ 已删除「${c.name}」(${c.code_prefix})`);
      deleted++;
    }

    console.log(`\n🎉 完成：删除 ${deleted} 个 / 保留 ${kept} 个（有任务）`);
    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败：', error.message);
    process.exit(1);
  }
}

clear();
