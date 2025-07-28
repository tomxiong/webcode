import { Database } from './dist/infrastructure/database/Database.js';

const database = new Database();
await database.initialize();

// 查询所有用户
const users = database.db.prepare('SELECT * FROM users').all();
console.log('数据库中的用户:', users);

// 查询特定用户
const admin = database.db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
console.log('Admin用户:', admin);

database.close();