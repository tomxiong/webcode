// CLSI平台功能演示
async function demonstratePlatform() {
  const baseUrl = 'http://localhost:3000'
  
  console.log('🎯 CLSI标准和专家规则管理平台功能演示')
  console.log('=' .repeat(60))
  
  try {
    // 1. 健康检查
    console.log('\n📋 1. 系统健康检查')
    const healthResponse = await fetch(`${baseUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ 系统状态:', healthData.status === 'ok' ? '正常运行' : '异常')
    console.log('   时间戳:', healthData.timestamp)
    
    // 2. 用户认证演示
    console.log('\n🔐 2. 用户认证系统演示')
    
    // 注册新用户
    console.log('   📝 注册新用户...')
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'demo_user',
        email: 'demo@clsi-platform.com',
        password: 'demo123',
        role: 'MICROBIOLOGIST'
      })
    })
    const registerData = await registerResponse.json()
    console.log('   ✅ 用户注册:', registerData.success ? '成功' : `失败: ${registerData.error}`)
    
    // 用户登录
    console.log('   🔑 用户登录...')
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    })
    const loginData = await loginResponse.json()
    console.log('   ✅ 登录状态:', loginData.success ? '成功' : '失败')
    console.log('   👤 用户信息:', loginData.user ? `${loginData.user.username} (${loginData.user.role})` : '无')
    
    if (!loginData.token) {
      console.log('❌ 无法获取认证令牌，演示终止')
      return
    }
    
    const token = loginData.token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    
    // 3. 微生物管理演示
    console.log('\n🦠 3. 微生物数据库管理演示')
    
    // 获取所有微生物
    const microResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const microData = await microResponse.json()
    console.log('   📊 微生物总数:', microData.data?.length || 0)
    
    // 显示微生物列表
    if (microData.data && microData.data.length > 0) {
      console.log('   📋 微生物列表:')
      microData.data.slice(0, 3).forEach((micro: any, index: number) => {
        console.log(`      ${index + 1}. ${micro.genus} ${micro.species} (${micro.commonName || '无常用名'})`)
      })
    }
    
    // 获取属列表
    const generaResponse = await fetch(`${baseUrl}/api/microorganisms/genera`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const generaData = await generaResponse.json()
    console.log('   🏷️  微生物属数:', generaData.data?.length || 0)
    console.log('   📝 属列表:', generaData.data?.slice(0, 5).join(', ') || '无')
    
    // 创建新微生物
    console.log('   ➕ 创建新微生物...')
    const createMicroResponse = await fetch(`${baseUrl}/api/microorganisms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        genus: 'Acinetobacter',
        species: 'baumannii',
        commonName: 'A. baumannii',
        description: '革兰阴性杆菌，常见的院内感染病原菌'
      })
    })
    const createMicroData = await createMicroResponse.json()
    console.log('   ✅ 创建结果:', createMicroData.success ? '成功' : `失败: ${createMicroData.error}`)
    
    // 4. 药物管理演示
    console.log('\n💊 4. 药物数据库管理演示')
    
    // 获取所有药物
    const drugResponse = await fetch(`${baseUrl}/api/drugs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const drugData = await drugResponse.json()
    console.log('   📊 药物总数:', drugData.data?.length || 0)
    
    // 显示药物列表
    if (drugData.data && drugData.data.length > 0) {
      console.log('   📋 药物列表:')
      drugData.data.slice(0, 3).forEach((drug: any, index: number) => {
        console.log(`      ${index + 1}. ${drug.name} (${drug.code}) - ${drug.category}`)
      })
    }
    
    // 获取药物分类
    const categoriesResponse = await fetch(`${baseUrl}/api/drugs/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const categoriesData = await categoriesResponse.json()
    console.log('   🏷️  药物分类:', categoriesData.data?.join(', ') || '无')
    
    // 获取药物统计
    const statsResponse = await fetch(`${baseUrl}/api/drugs/statistics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const statsData = await statsResponse.json()
    if (statsData.success) {
      console.log('   📈 药物统计:')
      console.log(`      总数: ${statsData.data.totalDrugs}`)
      console.log(`      活跃: ${statsData.data.activeCount}`)
      console.log(`      非活跃: ${statsData.data.inactiveCount}`)
    }
    
    // 创建新药物
    console.log('   ➕ 创建新药物...')
    const createDrugResponse = await fetch(`${baseUrl}/api/drugs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Colistin',
        code: 'COL',
        category: 'ANTIBIOTIC',
        description: '多粘菌素，用于治疗多重耐药革兰阴性菌感染'
      })
    })
    const createDrugData = await createDrugResponse.json()
    console.log('   ✅ 创建结果:', createDrugData.success ? '成功' : `失败: ${createDrugData.error}`)
    
    // 5. 搜索功能演示
    console.log('\n🔍 5. 搜索功能演示')
    
    // 搜索微生物
    const searchMicroResponse = await fetch(`${baseUrl}/api/microorganisms/search?genus=Escherichia`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const searchMicroData = await searchMicroResponse.json()
    console.log('   🦠 搜索"Escherichia"属微生物:', searchMicroData.data?.length || 0, '个结果')
    
    // 搜索抗生素
    const searchDrugResponse = await fetch(`${baseUrl}/api/drugs/search?category=ANTIBIOTIC`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const searchDrugData = await searchDrugResponse.json()
    console.log('   💊 搜索抗生素类药物:', searchDrugData.data?.length || 0, '个结果')
    
    // 6. 权限控制演示
    console.log('\n🛡️  6. 权限控制演示')
    
    // 获取当前用户信息
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const meData = await meResponse.json()
    if (meData.success) {
      console.log('   👤 当前用户:', meData.user.username)
      console.log('   🏷️  用户角色:', meData.user.role)
      console.log('   ✅ 权限状态:', meData.user.isActive ? '活跃' : '非活跃')
    }
    
    console.log('\n🎉 演示完成！')
    console.log('=' .repeat(60))
    console.log('✅ 已完成功能模块:')
    console.log('   1. 用户认证和授权系统 (JWT + 角色权限)')
    console.log('   2. 微生物数据库管理 (层次化数据结构)')
    console.log('   3. 药物基础数据管理 (分类管理)')
    console.log('   4. RESTful API接口 (完整CRUD操作)')
    console.log('   5. 数据搜索和过滤功能')
    console.log('   6. 角色基础的权限控制')
    console.log('\n🚧 待开发功能:')
    console.log('   - 折点标准管理 (年份版本控制)')
    console.log('   - 专家规则引擎 (验证逻辑)')
    console.log('   - 实验室样本数据输入')
    console.log('   - 结果验证系统')
    console.log('   - 交叉引用功能')
    console.log('   - 参考文档管理')
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error)
  }
}

// 运行演示
demonstratePlatform()