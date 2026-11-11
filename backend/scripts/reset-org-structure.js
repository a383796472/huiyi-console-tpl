/**
 * 重置组织架构与用户
 * 1) 部门名称唯一约束改为「同级不重名」（研发中心与制造中心都有「数据管理」）
 * 2) 按公司组织结构重建部门树（支持多级子部门）
 * 3) 仅保留 admin 超级管理员，其余用户全部删除
 * 用法：node scripts/reset-org-structure.js
 */
const db = require('../config/db');

const TREE = [
  {
    name: '广东硕为科技有限公司',
    children: [
      { name: '总经办' },
      {
        name: '研发中心',
        children: ['ID设计组', '平板结构组', '品牌结构组', '项目落地组', '数据管理', '产品开发', '电子工程组']
      },
      {
        name: '营销中心',
        children: [
          '设计组',
          { name: 'GR品牌', children: ['海外', '内容中心'] },
          { name: '销售事业部', children: ['GR销售', 'MK销售'] },
          {
            name: '电商事业部',
            children: [
              { name: '跨境', children: ['亚马逊', '独立站', 'TK'] },
              { name: '国内', children: ['天猫淘宝', '京东', '抖音', '国内营销'] }
            ]
          }
        ]
      },
      {
        name: '制造中心',
        children: ['计划部', '塑模部', '装配部', '数据管理']
      },
      {
        name: '供应链中心',
        children: [
          '品质部',
          { name: '采购部', children: ['工厂采购组', '销售采购组'] },
          '仓储部',
          '物流部'
        ]
      },
      {
        name: '支持中心',
        children: [
          {
            name: '财务部',
            children: [
              '生产制造端财务',
              { name: '广州财务团队', children: ['销售核算组'] }
            ]
          },
          '人事行政部',
          'IT部'
        ]
      }
    ]
  }
];

async function ensureIndexes() {
  const [indexes] = await db.query('SHOW INDEX FROM departments');
  const nameUnique = indexes.some((i) => i.Key_name === 'name' && i.Non_unique === 0);
  if (nameUnique) {
    await db.query('ALTER TABLE departments DROP INDEX `name`');
    console.log('+ 已移除 departments.name 唯一索引（允许不同部门同名）');
  }

  const hasNameIndex = indexes.some((i) => i.Key_name === 'idx_dept_name');
  if (!hasNameIndex) {
    await db.query('ALTER TABLE departments ADD INDEX idx_dept_name (name)');
    console.log('+ 已添加 departments.name 普通索引');
  }

  const hasParentIndex = indexes.some((i) => i.Key_name === 'idx_dept_parent');
  if (!hasParentIndex) {
    await db.query('ALTER TABLE departments ADD INDEX idx_dept_parent (parent_id)');
    console.log('+ 已添加 departments.parent_id 索引');
  }
}

async function insertNode(node, parentId, sortOrder) {
  const [result] = await db.query(
    'INSERT INTO departments (name, parent_id, sort_order, status) VALUES (?, ?, ?, 1)',
    [node.name, parentId, sortOrder]
  );
  const id = result.insertId;
  const children = node.children || [];
  for (let i = 0; i < children.length; i++) {
    const child = typeof children[i] === 'string' ? { name: children[i] } : children[i];
    await insertNode(child, id, i);
  }
  return id;
}

async function reset() {
  try {
    await ensureIndexes();

    // 1. 删除除 admin 外的所有用户
    const [removed] = await db.query("DELETE FROM users WHERE username <> 'admin'");
    console.log(`+ 已删除非 admin 用户：${removed.affectedRows} 个`);

    // 2. 清空部门前先解除用户引用，避免悬挂 department_id
    await db.query('UPDATE users SET department_id = NULL');
    await db.query('DELETE FROM departments');
    console.log('+ 旧部门已清空');

    // 3. 按组织树重建（唯一根节点为公司）
    const rootId = await insertNode(TREE[0], null, 0);
    console.log('+ 新部门树已创建');

    // 4. admin 归入公司根节点（不挂在任何具体部门）
    await db.query("UPDATE users SET department_id = ? WHERE username = 'admin'", [rootId]);
    console.log(`+ admin 已归入 ${TREE[0].name}（id=${rootId}）`);

    // 5. 校验输出
    const [rows] = await db.query(
      `SELECT d1.id, d1.name, d1.parent_id, d1.sort_order,
              (SELECT name FROM departments d2 WHERE d2.id = d1.parent_id) AS parent_name
       FROM departments d1 ORDER BY d1.sort_order, d1.id`
    );
    console.log('\n部门树：');
    for (const r of rows) {
      const indent = r.parent_name ? '    ' : '';
      console.log(`${indent}${r.id}\t${r.name}${r.parent_name ? `（上级：${r.parent_name}）` : ''}`);
    }

    const [users] = await db.query('SELECT id, username, role FROM users ORDER BY id');
    console.log('\n用户：', JSON.stringify(users));
    console.log(`\n✅ 组织架构重置完成，部门共 ${rows.length} 个`);
    process.exit(0);
  } catch (err) {
    console.error('❌ 组织架构重置失败：', err.message);
    process.exit(1);
  }
}

reset();
