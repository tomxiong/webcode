import { spawn } from 'child_process'
import { Database } from '../../infrastructure/database/Database.js'

async function runE2ETests() {
  console.log('🧪 Starting E2E Tests for Management Interfaces...')
  
  // 确保服务器正在运行
  try {
    const healthCheck = await fetch('http://localhost:3000/health')
    if (!healthCheck.ok) {
      throw new Error('Server not running')
    }
    console.log('✅ Server is running')
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first with: npm start')
    process.exit(1)
  }

  // 运行各个管理界面的E2E测试
  const testFiles = [
    'src/tests/e2e/users-management.test.ts',
    'src/tests/e2e/microorganisms-management.test.ts',
    'src/tests/e2e/drugs-management.test.ts'
  ]

  for (const testFile of testFiles) {
    console.log(`\n🔍 Running ${testFile}...`)
    
    try {
      await runVitest(testFile)
      console.log(`✅ ${testFile} passed`)
    } catch (error) {
      console.error(`❌ ${testFile} failed:`, error)
    }
  }
}

function runVitest(testFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const vitest = spawn('npx', ['vitest', 'run', testFile], {
      stdio: 'inherit',
      shell: true
    })

    vitest.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Test failed with exit code ${code}`))
      }
    })

    vitest.on('error', (error) => {
      reject(error)
    })
  })
}

runE2ETests().catch(console.error)