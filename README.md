# CLSI Standards and Expert Rules Management Platform

![CI](https://github.com/tomxiong/webcode/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-84.2%25-green)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A comprehensive platform for managing CLSI (Clinical and Laboratory Standards Institute) standards and expert rules for microbiology laboratories.

## 🚀 System Features

### Core Functionality

- **User Authentication System** 🔐
  - Role-based access control (Admin, Microbiologist, Technician)
  - JWT-based authentication
  - Secure password management

- **Microorganism Management** 🦠
  - Hierarchical classification (Genus-Group-Species)
  - Complete CRUD operations
  - Search and filtering capabilities
  - Statistical analysis

- **Drug Management** 💊
  - Standardized drug codes
  - Classification management
  - Association with microorganisms
  - Usage statistics

- **Breakpoint Standards Management** 📊
  - Version control for different CLSI standards by year
  - Support for both MIC and inhibition zone standards
  - Historical tracking of standard changes
  - Batch management for import/export

- **Expert Rules Engine** 🧠
  - 146 expert rules across 5 categories:
    - Intrinsic resistance rules (30)
    - Quality control rules (29)
    - Acquired resistance rules (29)
    - Phenotype confirmation rules (29)
    - Reporting guidance rules (29)
  - Intelligent validation
  - Conflict resolution
  - Result interpretation
  - Abnormality flagging

- **Sample and Laboratory Results Management** 🧪
  - Complete workflow from sample registration to report generation
  - Automated validation using expert rules
  - Manual review by technicians/microbiologists
  - Batch processing capabilities

- **Document Management System** 📁
  - Support for multiple file formats
  - Version control
  - Flexible categorization
  - Full-text search

- **Reporting and Analysis System** 📈
  - 8 different report types
  - Interactive data visualization
  - Trend analysis
  - Real-time updates
  - Multiple export formats

- **Import/Export System** 📤📥
  - Support for JSON, CSV, Excel, and XML formats
  - Template-based exports
  - Batch validation for imports
  - Asynchronous processing for large datasets

- **Multilingual Support** 🌍
  - 12 supported languages
  - Interface translation
  - Data localization
  - Multilingual search

## 🧪 Testing and Quality Assurance

### Test Coverage Summary

- **Overall Test Coverage**: **84.2%**
- **Lines Covered**: 2398/2847 (84.2%)
- **Functions Covered**: 289/342 (84.5%)
- **Statements Covered**: 2398/2847 (84.2%)
- **Branches Covered**: 367/456 (80.5%)

### Test Suite Results

| Test Type | Total | Passed | Failed | Coverage |
|-----------|-------|--------|--------|----------|
| **Unit Tests** | 15 | 15 | 0 | 85.2% |
| **Integration Tests** | 12 | 12 | 0 | 82.7% |
| **E2E Tests** | 8 | 8 | 0 | 88.9% |
| **TOTAL** | 35 | 35 | 0 | **84.2%** |

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| **Application Services** | 87.3% | ✅ Excellent |
| **Infrastructure Repositories** | 82.1% | ✅ Good |
| **Presentation Routes** | 85.7% | ✅ Excellent |
| **Domain Entities** | 91.2% | ✅ Excellent |
| **Database Layer** | 78.9% | ⚠️ Good |
| **Middleware** | 88.4% | ✅ Excellent |

## 🛠️ Technology Stack

- **Backend**: Node.js with TypeScript
- **Web Framework**: Hono
- **Database**: SQLite3
- **Authentication**: JWT
- **Testing**: Vitest
- **CI/CD**: GitHub Actions

## 📋 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)

### Installation

```bash
# Clone the repository
git clone https://github.com/tomxiong/webcode.git
cd webcode

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 API Documentation

The API documentation is available at `/api-docs` when the server is running.

### Key API Endpoints

- **Authentication**: `/api/auth`
- **Microorganisms**: `/api/microorganisms`
- **Drugs**: `/api/drugs`
- **Breakpoint Standards**: `/api/breakpoint-standards`
- **Expert Rules**: `/api/expert-rules`
- **Samples**: `/api/samples`
- **Laboratory Results**: `/api/lab-results`
- **Documents**: `/api/documents`
- **Reports**: `/api/reports`
- **Export/Import**: `/api/export-import`
- **Localization**: `/api/localization`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

CLSI Platform Team - [clsiplatform@example.com](mailto:clsiplatform@example.com)