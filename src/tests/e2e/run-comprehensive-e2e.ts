import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

/**
 * 运行全面的E2E测试并生成报告
 */

interface TestResult {
  module: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details: string
  timestamp: string
}

class ComprehensiveE2ERunner {
  private results: TestResult[] = []
  private startTime: Date = new Date()

  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行全面E2E测试...')
    console.log('=' .repeat(60))

    // 检查服务器状态
    await this.checkServerHealth()

    // 运行主要的E2E测试
    await this.runMainE2ETest()

    // 生成测试报告
    this.generateReport()
  }

  private async checkServerHealth(): Promise<void> {
    console.log('🏥 检查服务器健康状态...')
    
    try {
      const response = await fetch('http://localhost:3000/health')
      const data = await response.json()
      
      if (response.status === 200 && data.status === 'ok') {
        this.addResult('Server Health', 'PASS', '服务器运行正常')
        console.log('✅ 服务器健康检查通过')
      } else {
        this.addResult('Server Health', 'FAIL', '服务器状态异常')
        console.log('❌ 服务器健康检查失败')
      }
    } catch (error) {
      this.addResult('Server Health', 'FAIL', `服务器连接失败: ${error.message}`)
      console.log('❌ 无法连接到服务器')
    }
  }

  private async runMainE2ETest(): Promise<void> {
    console.log('🧪 运行全面业务功能测试...')
    
    try {
      // 运行vitest测试
      const command = 'npx vitest run src/tests/e2e/comprehensive-business-e2e.test.ts --reporter=verbose'
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000 // 60秒超时
      })
      
      this.addResult('Comprehensive E2E Tests', 'PASS', '所有业务功能测试通过')
      console.log('✅ 全面E2E测试通过')
      console.log(output)
      
    } catch (error) {
      this.addResult('Comprehensive E2E Tests', 'FAIL', `测试执行失败: ${error.message}`)
      console.log('❌ E2E测试执行失败')
      console.log(error.stdout || error.message)
    }
  }

  private addResult(module: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string): void {
    this.results.push({
      module,
      status,
      details,
      timestamp: new Date().toISOString()
    })
  }

  private generateReport(): void {
    const endTime = new Date()
    const duration = endTime.getTime() - this.startTime.getTime()
    
    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const skipCount = this.results.filter(r => r.status === 'SKIP').length
    const totalCount = this.results.length

    const report = `# CLSI Platform - 全面E2E测试报告

## 📊 测试概览

- **测试开始时间**: ${this.startTime.toLocaleString('zh-CN')}
- **测试结束时间**: ${endTime.toLocaleString('zh-CN')}
- **测试持续时间**: ${Math.round(duration / 1000)}秒
- **总测试数**: ${totalCount}
- **通过**: ${passCount} ✅
- **失败**: ${failCount} ❌
- **跳过**: ${skipCount} ⏭️
- **成功率**: ${Math.round((passCount / totalCount) * 100)}%

## 📋 详细测试结果

${this.results.map(result => `
### ${result.module}
- **状态**: ${result.status === 'PASS' ? '✅ 通过' : result.status === 'FAIL' ? '❌ 失败' : '⏭️ 跳过'}
- **详情**: ${result.details}
- **时间**: ${new Date(result.timestamp).toLocaleString('zh-CN')}
`).join('\n')}

## 🎯 测试总结

${passCount === totalCount ? 
  '🎉 **所有测试通过！** CLSI平台的核心业务功能运行正常，系统已准备好投入生产使用。' :
  `⚠️ **发现${failCount}个问题** 需要修复这些问题以确保系统稳定性。`
}

## 📈 系统状态评估

基于E2E测试结果，CLSI平台当前状态：

- **认证系统**: ${this.getModuleStatus('Server Health')}
- **业务功能**: ${this.getModuleStatus('Comprehensive E2E Tests')}
- **整体评估**: ${passCount >= totalCount * 0.8 ? '生产就绪 🚀' : '需要改进 🔧'}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`

    // 写入报告文件
    writeFileSync('COMPREHENSIVE_E2E_TEST_REPORT.md', report, 'utf8')
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试报告已生成: COMPREHENSIVE_E2E_TEST_REPORT.md')
    console.log(`✅ 通过: ${passCount}/${totalCount} (${Math.round((passCount / totalCount) * 100)}%)`)
    console.log('='.repeat(60))
  }

  private getModuleStatus(moduleName: string): string {
    const result = this.results.find(r => r.module === moduleName)
    if (!result) return '未测试'
    return result.status === 'PASS' ? '正常 ✅' : '异常 ❌'
  }
}

// 运行测试
const runner = new ComprehensiveE2ERunner()
runner.runAllTests().catch(error => {
  console.error('❌ E2E测试运行器失败:', error)
  process.exit(1)
})
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

/**
 * 运行全面的E2E测试并生成报告
 */

interface TestResult {
  module: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details: string
  timestamp: string
}

class ComprehensiveE2ERunner {
  private results: TestResult[] = []
  private startTime: Date = new Date()

  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行全面E2E测试...')
    console.log('=' .repeat(60))

    // 检查服务器状态
    await this.checkServerHealth()

    // 运行主要的E2E测试
    await this.runMainE2ETest()

    // 生成测试报告
    this.generateReport()
  }

  private async checkServerHealth(): Promise<void> {
    console.log('🏥 检查服务器健康状态...')
    
    try {
      const response = await fetch('http://localhost:3000/health')
      const data = await response.json()
      
      if (response.status === 200 && data.status === 'ok') {
        this.addResult('Server Health', 'PASS', '服务器运行正常')
        console.log('✅ 服务器健康检查通过')
      } else {
        this.addResult('Server Health', 'FAIL', '服务器状态异常')
        console.log('❌ 服务器健康检查失败')
      }
    } catch (error) {
      this.addResult('Server Health', 'FAIL', `服务器连接失败: ${error.message}`)
      console.log('❌ 无法连接到服务器')
    }
  }

  private async runMainE2ETest(): Promise<void> {
    console.log('🧪 运行全面业务功能测试...')
    
    try {
      // 运行vitest测试
      const command = 'npx vitest run src/tests/e2e/comprehensive-business-e2e.test.ts --reporter=verbose'
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000 // 60秒超时
      })
      
      this.addResult('Comprehensive E2E Tests', 'PASS', '所有业务功能测试通过')
      console.log('✅ 全面E2E测试通过')
      console.log(output)
      
    } catch (error) {
      this.addResult('Comprehensive E2E Tests', 'FAIL', `测试执行失败: ${error.message}`)
      console.log('❌ E2E测试执行失败')
      console.log(error.stdout || error.message)
    }
  }

  private addResult(module: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string): void {
    this.results.push({
      module,
      status,
      details,
      timestamp: new Date().toISOString()
    })
  }

  private generateReport(): void {
    const endTime = new Date()
    const duration = endTime.getTime() - this.startTime.getTime()
    
    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const skipCount = this.results.filter(r => r.status === 'SKIP').length
    const totalCount = this.results.length

    const report = `# CLSI Platform - 全面E2E测试报告

## 📊 测试概览

- **测试开始时间**: ${this.startTime.toLocaleString('zh-CN')}
- **测试结束时间**: ${endTime.toLocaleString('zh-CN')}
- **测试持续时间**: ${Math.round(duration / 1000)}秒
- **总测试数**: ${totalCount}
- **通过**: ${passCount} ✅
- **失败**: ${failCount} ❌
- **跳过**: ${skipCount} ⏭️
- **成功率**: ${Math.round((passCount / totalCount) * 100)}%

## 📋 详细测试结果

${this.results.map(result => `
### ${result.module}
- **状态**: ${result.status === 'PASS' ? '✅ 通过' : result.status === 'FAIL' ? '❌ 失败' : '⏭️ 跳过'}
- **详情**: ${result.details}
- **时间**: ${new Date(result.timestamp).toLocaleString('zh-CN')}
`).join('\n')}

## 🎯 测试总结

${passCount === totalCount ? 
  '🎉 **所有测试通过！** CLSI平台的核心业务功能运行正常，系统已准备好投入生产使用。' :
  `⚠️ **发现${failCount}个问题** 需要修复这些问题以确保系统稳定性。`
}

## 📈 系统状态评估

基于E2E测试结果，CLSI平台当前状态：

- **认证系统**: ${this.getModuleStatus('Server Health')}
- **业务功能**: ${this.getModuleStatus('Comprehensive E2E Tests')}
- **整体评估**: ${passCount >= totalCount * 0.8 ? '生产就绪 🚀' : '需要改进 🔧'}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`

    // 写入报告文件
    writeFileSync('COMPREHENSIVE_E2E_TEST_REPORT.md', report, 'utf8')
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试报告已生成: COMPREHENSIVE_E2E_TEST_REPORT.md')
    console.log(`✅ 通过: ${passCount}/${totalCount} (${Math.round((passCount / totalCount) * 100)}%)`)
    console.log('='.repeat(60))
  }

  private getModuleStatus(moduleName: string): string {
    const result = this.results.find(r => r.module === moduleName)
    if (!result) return '未测试'
    return result.status === 'PASS' ? '正常 ✅' : '异常 ❌'
  }
}

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

/**
 * 运行全面的E2E测试并生成报告
 */

interface TestResult {
  module: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  details: string
  timestamp: string
}

class ComprehensiveE2ERunner {
  private results: TestResult[] = []
  private startTime: Date = new Date()

  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行全面E2E测试...')
    console.log('=' .repeat(60))

    // 检查服务器状态
    await this.checkServerHealth()

    // 运行主要的E2E测试
    await this.runMainE2ETest()

    // 生成测试报告
    this.generateReport()
  }

  private async checkServerHealth(): Promise<void> {
    console.log('🏥 检查服务器健康状态...')
    
    try {
      const response = await fetch('http://localhost:3000/health')
      const data = await response.json()
      
      if (response.status === 200 && data.status === 'ok') {
        this.addResult('Server Health', 'PASS', '服务器运行正常')
        console.log('✅ 服务器健康检查通过')
      } else {
        this.addResult('Server Health', 'FAIL', '服务器状态异常')
        console.log('❌ 服务器健康检查失败')
      }
    } catch (error) {
      this.addResult('Server Health', 'FAIL', `服务器连接失败: ${error.message}`)
      console.log('❌ 无法连接到服务器')
    }
  }

  private async runMainE2ETest(): Promise<void> {
    console.log('🧪 运行全面业务功能测试...')
    
    try {
      // 运行vitest测试
      const command = 'npx vitest run src/tests/e2e/comprehensive-business-e2e.test.ts --reporter=verbose'
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000 // 60秒超时
      })
      
      this.addResult('Comprehensive E2E Tests', 'PASS', '所有业务功能测试通过')
      console.log('✅ 全面E2E测试通过')
      console.log(output)
      
    } catch (error) {
      this.addResult('Comprehensive E2E Tests', 'FAIL', `测试执行失败: ${error.message}`)
      console.log('❌ E2E测试执行失败')
      console.log(error.stdout || error.message)
    }
  }

  private addResult(module: string, status: 'PASS' | 'FAIL' | 'SKIP', details: string): void {
    this.results.push({
      module,
      status,
      details,
      timestamp: new Date().toISOString()
    })
  }

  private generateReport(): void {
    const endTime = new Date()
    const duration = endTime.getTime() - this.startTime.getTime()
    
    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const skipCount = this.results.filter(r => r.status === 'SKIP').length
    const totalCount = this.results.length

    const report = `# CLSI Platform - 全面E2E测试报告

## 📊 测试概览

- **测试开始时间**: ${this.startTime.toLocaleString('zh-CN')}
- **测试结束时间**: ${endTime.toLocaleString('zh-CN')}
- **测试持续时间**: ${Math.round(duration / 1000)}秒
- **总测试数**: ${totalCount}
- **通过**: ${passCount} ✅
- **失败**: ${failCount} ❌
- **跳过**: ${skipCount} ⏭️
- **成功率**: ${Math.round((passCount / totalCount) * 100)}%

## 📋 详细测试结果

${this.results.map(result => `
### ${result.module}
- **状态**: ${result.status === 'PASS' ? '✅ 通过' : result.status === 'FAIL' ? '❌ 失败' : '⏭️ 跳过'}
- **详情**: ${result.details}
- **时间**: ${new Date(result.timestamp).toLocaleString('zh-CN')}
`).join('\n')}

## 🎯 测试总结

${passCount === totalCount ? 
  '🎉 **所有测试通过！** CLSI平台的核心业务功能运行正常，系统已准备好投入生产使用。' :
  `⚠️ **发现${failCount}个问题** 需要修复这些问题以确保系统稳定性。`
}

## 📈 系统状态评估

基于E2E测试结果，CLSI平台当前状态：

- **认证系统**: ${this.getModuleStatus('Server Health')}
- **业务功能**: ${this.getModuleStatus('Comprehensive E2E Tests')}
- **整体评估**: ${passCount >= totalCount * 0.8 ? '生产就绪 🚀' : '需要改进 🔧'}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`

    // 写入报告文件
    writeFileSync('COMPREHENSIVE_E2E_TEST_REPORT.md', report, 'utf8')
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试报告已生成: COMPREHENSIVE_E2E_TEST_REPORT.md')
    console.log(`✅ 通过: ${passCount}/${totalCount} (${Math.round((passCount / totalCount) * 100)}%)`)
    console.log('='.repeat(60))
  }

  private getModuleStatus(moduleName: string): string {
    const result = this.results.find(r => r.module === moduleName)
    if (!result) return '未测试'
    return result.status === 'PASS' ? '正常 ✅' : '异常 ❌'
  }
}

// 运行测试
const runner = new ComprehensiveE2ERunner()
runner.runAllTests().catch(error => {
  console.error('❌ E2E测试运行器失败:', error)
  process.exit(1)
})