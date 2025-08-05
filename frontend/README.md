# Bela - Hospital Discharge Management System

A production-ready React + TypeScript application for physicians and discharge nurses to streamline the bedside discharge process.

## 🏥 Overview

Bela is a comprehensive discharge management system that provides:

- **AI-Powered Discharge Summaries** - Generate and edit summaries with side-by-side diff review
- **Patient-Friendly Instructions** - Create instructions tailored to literacy level and language
- **Medication Reconciliation** - Drag-and-drop interface with conflict detection
- **Smart Scheduling** - Book follow-up appointments with automated patient communication
- **Communication Hub** - Integrated SMS and voice call management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bela

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS with custom hospital design system
- **State Management**: Recoil
- **Routing**: React Router v6
- **UI Components**: shadcn/ui with clinical customizations
- **Mock Services**: MSW (Mock Service Worker)
- **Testing**: Vitest + React Testing Library

## 📁 Project Structure

```
src/
├── components/
│   ├── common/           # Shared components (TopNav, PatientHeader, etc.)
│   ├── features/         # Feature-specific components
│   ├── auth/            # Authentication components
│   └── ui/              # Base UI components (shadcn/ui)
├── pages/               # Route components
├── services/            # Mock API services (FHIR, translation, telecom)
├── store/               # Recoil state atoms
└── hooks/               # Custom React hooks
```

## 🎨 Design System

The application uses a clinical-grade design system with:

- **Hospital Brand Colors**: Primary (#004c97), Secondary (#0074c0)
- **Clinical Status Colors**: Success (green), Warning (amber), Danger (red), Info (blue)
- **Typography Scale**: Clinical headings and body text optimized for readability
- **Component Variants**: Custom variants for buttons, cards, and status indicators
- **Dark/Light Mode**: Automatic theme switching

## 🔒 Security & Compliance

- **Authentication**: Token-based auth with role-based access control
- **PHI Protection**: Environment variable `VITE_ENABLE_DEID` for data redaction
- **Audit Logging**: All critical actions logged with data hashes
- **HIPAA Compliance**: Mock compliance features for demonstration

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Linting
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🧪 Testing

The project includes comprehensive testing with ≥80% coverage target:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test SummaryEditor.test.tsx
```

## 🌐 Mock API Endpoints

The application uses MSW to mock the following services:

### FHIR Service
- `GET /fhir/Patient/{id}` - Get patient data
- `GET /fhir/Encounter/{id}/notes` - Get encounter notes
- `POST /fhir/DocumentReference` - Submit discharge summary
- `POST /fhir/Appointment` - Create appointment

### Translation Service
- `POST /api/translate` - Translate patient instructions
- `GET /api/languages` - Get available languages
- `POST /api/readability` - Validate readability score

### Telecom Service
- `POST /api/sms/send` - Send SMS message
- `GET /api/sms/history` - Get SMS history
- `POST /api/voice/call` - Initiate voice call
- `POST /api/voice/bot` - Start voice bot

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be in the `dist/` folder.

### Environment Variables

```bash
# Optional - Enable PHI data redaction
VITE_ENABLE_DEID=true

# Mock service configuration
VITE_API_BASE_URL=http://localhost:8080
```

## 👥 User Roles

- **Clinician**: Full access to all discharge management features
- **Nurse**: Access to scheduling and communication features
- **Admin**: System administration and audit log access

## 📋 Core Workflows

### 1. Discharge Summary
1. AI generates draft from encounter notes
2. Clinician reviews and edits in rich text editor
3. Side-by-side diff shows changes
4. Sign & file submits to EHR

### 2. Patient Instructions
1. Select literacy level and language
2. AI translates to patient-friendly format
3. Readability scoring and recommendations
4. Print or send to patient portal

### 3. Medication Reconciliation
1. Compare home, hospital, and discharge medications
2. Drag-and-drop to reconcile medications
3. Highlight conflicts for resolution
4. Generate final reconciled list

### 4. Appointment Scheduling
1. View available slots in calendar
2. One-click booking with provider
3. Automated patient notifications
4. Voice bot fallback for no available slots

## 🎯 Performance Features

- **Code Splitting**: Lazy loading of feature components
- **Optimistic Updates**: Immediate UI feedback
- **Caching**: React Query for API response caching
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 AA compliance

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact: healthcare-dev@bela.com
- Documentation: https://docs.bela.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Bela** - Streamlining hospital discharge for better patient outcomes.