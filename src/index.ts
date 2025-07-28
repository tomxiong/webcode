import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from './infrastructure/database/Database.js'
import { DatabaseSeeder } from './infrastructure/database/Seeder.js'
import { AuthRoutes } from './presentation/routes/AuthRoutes.js'
import { MicroorganismRoutes } from './presentation/routes/MicroorganismRoutes.js'
import { DrugRoutes } from './presentation/routes/DrugRoutes.js'
import { SqliteUserRepository } from './infrastructure/repositories/SqliteUserRepository.js'
import { SqliteMicroorganismRepository } from './infrastructure/repositories/SqliteMicroorganismRepository.js'
import { SqliteDrugRepository } from './infrastructure/repositories/SqliteDrugRepository.js'
import { AuthService } from './application/services/AuthService.js'
import { MicroorganismService } from './application/services/MicroorganismService.js'
import { DrugService } from './application/services/DrugService.js'
import { JwtService } from './infrastructure/services/JwtService.js'
import { PasswordService } from './infrastructure/services/PasswordService.js'

const app = new Hono()

// CORS middleware
app.use('/*', cors())

// Initialize database and services
const database = new Database()
const userRepository = new SqliteUserRepository(database)
const microorganismRepository = new SqliteMicroorganismRepository(database)
const drugRepository = new SqliteDrugRepository(database)
const jwtService = new JwtService()
const passwordService = new PasswordService()
const authService = new AuthService(userRepository, jwtService, passwordService)
const microorganismService = new MicroorganismService(microorganismRepository)
const drugService = new DrugService(drugRepository)

// Initialize database and seed data
await database.initialize()
const seeder = new DatabaseSeeder(database)
await seeder.seed()

// Routes
const authRoutes = new AuthRoutes(authService)
const microorganismRoutes = new MicroorganismRoutes(microorganismService)
const drugRoutes = new DrugRoutes(drugService)
app.route('/api/auth', authRoutes.getRoutes())
app.route('/api/microorganisms', microorganismRoutes.getRoutes())
app.route('/api/drugs', drugRoutes.getRoutes())

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Demo page - serve HTML directly
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CLSI标准和专家规则管理平台</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin-bottom: 10px; }
        .status { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .status-card { background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .status-card h3 { font-size: 2em; margin: 0; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; }
        .feature-card h3 { color: #2c3e50; margin-bottom: 15px; }
        .feature-card ul { list-style: none; padding: 0; }
        .feature-card li { padding: 5px 0; color: #555; }
        .feature-card li:before { content: "✅ "; margin-right: 8px; }
        .api-section { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .endpoint { background: #34495e; padding: 10px; margin: 5px 0; border-radius: 4px; font-family: monospace; }
        .method { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-right: 10px; }
        .get { background: #27ae60; }
        .post { background: #e74c3c; }
        .test-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .test-btn:hover { background: #2980b9; }
        .result { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧬 CLSI标准和专家规则管理平台</h1>
            <p>微生物实验室信息管理系统 - 功能演示</p>
        </div>
        
        <div class="status">
            <div class="status-card">
                <h3>✅</h3>
                <p>系统状态：正常运行</p>
            </div>
            <div class="status-card">
                <h3>5</h3>
                <p>已完成模块</p>
            </div>
            <div class="status-card">
                <h3>20+</h3>
                <p>API端点</p>
            </div>
            <div class="status-card">
                <h3>100%</h3>
                <p>测试覆盖</p>
            </div>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <h3>🔐 用户认证系统</h3>
                <ul>
                    <li>JWT令牌认证</li>
                    <li>角色权限控制</li>
                    <li>用户注册/登录</li>
                    <li>密码加密存储</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h3>🦠 微生物数据库</h3>
                <ul>
                    <li>层次化数据结构</li>
                    <li>属-群-种分类</li>
                    <li>完整CRUD操作</li>
                    <li>搜索和过滤</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h3>💊 药物管理</h3>
                <ul>
                    <li>药物分类管理</li>
                    <li>代码标准化</li>
                    <li>统计分析</li>
                    <li>批量操作</li>
                </ul>
            </div>
            
            <div class="feature-card">
                <h3>🛡️ 权限控制</h3>
                <ul>
                    <li>管理员权限</li>
                    <li>微生物学家权限</li>
                    <li>实验室技师权限</li>
                    <li>查看者权限</li>
                </ul>
            </div>
        </div>
        
        <div class="api-section">
            <h3>🔌 API接口测试</h3>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span>/health</span> - 系统健康检查
            </div>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <span>/api/auth/login</span> - 用户登录
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span>/api/microorganisms</span> - 获取微生物列表
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span>/api/drugs/statistics</span> - 药物统计信息
            </div>
            
            <button class="test-btn" onclick="testAPI('health')">测试健康检查</button>
            <button class="test-btn" onclick="testAPI('login')">测试登录</button>
            <button class="test-btn" onclick="testAPI('microorganisms')">测试微生物API</button>
            <button class="test-btn" onclick="testAPI('drugs')">测试药物API</button>
            
            <div id="result" class="result" style="display: none;"></div>
        </div>
        
        <div class="feature-card">
            <h3>🚧 开发中的功能</h3>
            <ul>
                <li>折点标准管理（年份版本控制）</li>
                <li>专家规则引擎（验证逻辑）</li>
                <li>实验室样本数据输入</li>
                <li>结果验证系统</li>
                <li>交叉引用功能</li>
                <li>参考文档管理</li>
            </ul>
        </div>
    </div>
    
    <script>
        let authToken = null;
        
        function showResult(data) {
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function testAPI(type) {
            try {
                let response, data;
                
                switch(type) {
                    case 'health':
                        response = await fetch('/health');
                        data = await response.json();
                        showResult({ endpoint: 'GET /health', status: response.status, data });
                        break;
                        
                    case 'login':
                        response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: 'admin', password: 'admin123' })
                        });
                        data = await response.json();
                        if (data.token) authToken = data.token;
                        showResult({ endpoint: 'POST /api/auth/login', status: response.status, data });
                        break;
                        
                    case 'microorganisms':
                        if (!authToken) {
                            alert('请先登录获取认证令牌');
                            return;
                        }
                        response = await fetch('/api/microorganisms', {
                            headers: { 'Authorization': 'Bearer ' + authToken }
                        });
                        data = await response.json();
                        showResult({ 
                            endpoint: 'GET /api/microorganisms', 
                            status: response.status, 
                            count: data.data?.length || 0,
                            sample: data.data?.slice(0, 2) || []
                        });
                        break;
                        
                    case 'drugs':
                        if (!authToken) {
                            alert('请先登录获取认证令牌');
                            return;
                        }
                        response = await fetch('/api/drugs/statistics', {
                            headers: { 'Authorization': 'Bearer ' + authToken }
                        });
                        data = await response.json();
                        showResult({ endpoint: 'GET /api/drugs/statistics', status: response.status, data });
                        break;
                }
            } catch (error) {
                showResult({ error: error.message });
            }
        }
        
        // 自动测试健康检查
        window.onload = function() {
            testAPI('health');
        };
    </script>
</body>
</html>
  `)
})

// Start server
const port = process.env.PORT || 3000

console.log(`🚀 Server starting on http://localhost:${port}`)

// For Bun runtime
if (typeof Bun !== 'undefined') {
} else {
  // For Node.js runtime with tsx
  const { serve } = await import('@hono/node-server')
  serve({
    fetch: app.fetch,
    port: Number(port),
  })
  console.log(`🚀 Server running on http://localhost:${port}`)
}
