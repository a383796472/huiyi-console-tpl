// config/db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'a88953746',
    database: 'huiyi_test',
    port: 3306,
    connectionLimit: 20,
    waitForConnections: true,
    queueLimit: 0,
    acquireTimeout: 30000,
    timeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    charset: 'utf8mb4',
    connectTimeout: 10000
});

const db = pool.promise();

// ===== 连接池心跳：每30秒 ping 一次，防止 MySQL 服务端断开空闲连接 =====
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
  } catch (err) {
    console.error('💔 [DB] 心跳检测失败:', err.message);
  }
}, 30000);

pool.on('connection', () => {
    console.log('✅ [DB] 新连接已建立');
});

pool.on('acquire', (connection) => {
    console.log('📶 [DB] 连接已获取，线程ID:', connection.threadId);
});

pool.on('release', (connection) => {
    console.log('🔓 [DB] 连接已释放，线程ID:', connection.threadId);
});

pool.on('error', (err) => {
    console.error('❌ [DB] 连接池错误:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 [DB] 检测到连接丢失，连接池将自动重建连接');
    }
});

process.on('SIGINT', async () => {
    console.log('🛑 [DB] 正在关闭连接池...');
    await pool.end();
    process.exit(0);
});

module.exports = db;