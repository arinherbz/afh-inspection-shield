# AFH Inspection Shield

A production-ready web application for Washington State Adult Family Homes (AFH) providing inspection readiness and caregiver management.

## Features

### MVP - Inspection Shield
- **Inspection Readiness Dashboard**: Real-time tracking of required documents
- **Readiness Score**: 0-100% score based on document completeness
- **Document Management**: Upload and track all DSHS-required documents
- **Packet Generation**: One-click generation of complete inspection packets (PDF)
- **24-hour Cache**: Cached packets for quick access

### Phase 1 - Caregiver Management
- **Resident Management**: Complete resident profiles with medical info
- **eMAR (Medication Administration)**: Track and record medication administration
- **Incident Reporting**: Guided workflow for DSHS-compliant incident reports
- **Staff Management**: Track certifications and background checks
- **Reports & Exports**: Generate reports and export data

## Tech Stack

- **Frontend**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Icons**: lucide-react
- **Charts**: recharts
- **State Management**: React Context + React Query
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/afh-inspection-shield.git
cd afh-inspection-shield
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Database Setup

Create the following tables in your Supabase project:

#### homes
```sql
CREATE TABLE homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id),
  license_number TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  bed_capacity INT DEFAULT 6 CHECK (bed_capacity >= 6 AND bed_capacity <= 8),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### residents
```sql
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  room_number TEXT,
  admission_date DATE NOT NULL,
  birth_date DATE,
  medicaid_id TEXT,
  diagnoses TEXT[],
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  primary_physician TEXT,
  physician_phone TEXT,
  polst_on_file BOOLEAN DEFAULT FALSE,
  care_plan_completed BOOLEAN DEFAULT FALSE,
  assessment_completed BOOLEAN DEFAULT FALSE,
  discharge_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  alert_flags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### medications
```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id) NOT NULL,
  drug_name TEXT NOT NULL,
  dose TEXT NOT NULL,
  route TEXT NOT NULL,
  frequency TEXT NOT NULL,
  times TIME[],
  prn_reason TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  prescriber TEXT,
  pharmacy TEXT,
  pharmacy_phone TEXT,
  discontinued BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### staff
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'manager', 'caregiver', 'nurse')),
  certifications JSONB,
  background_check_date DATE,
  background_check_passed BOOLEAN,
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### incidents
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) NOT NULL,
  resident_id UUID REFERENCES residents(id) NOT NULL,
  reported_by UUID REFERENCES staff(id) NOT NULL,
  incident_type TEXT CHECK (incident_type IN ('fall', 'medication_error', 'behavior', 'injury', 'elopement', 'other')),
  occurred_at TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  witness_name TEXT,
  witness_statement TEXT,
  actions_taken TEXT,
  family_notified BOOLEAN DEFAULT FALSE,
  family_notified_at TIMESTAMP,
  family_notified_by UUID REFERENCES staff(id),
  dshs_notified BOOLEAN DEFAULT FALSE,
  dshs_notified_at TIMESTAMP,
  dshs_confirmation_number TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### required_documents
```sql
CREATE TABLE required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) NOT NULL,
  document_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('present', 'missing', 'expired', 'expiring')),
  uploaded_at TIMESTAMP,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### inspection_packets
```sql
CREATE TABLE inspection_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID REFERENCES homes(id) NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  generated_by UUID REFERENCES staff(id),
  pdf_url TEXT,
  document_count INT,
  missing_documents JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm test:ui` - Run tests with UI
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, Home)
├── hooks/            # Custom hooks
├── layouts/          # Page layouts (AuthLayout, MainLayout)
├── lib/              # Utilities (Supabase client)
├── pages/            # Page components
│   ├── Dashboard.jsx
│   ├── InspectionDashboard.jsx
│   ├── Login.jsx
│   ├── Medications.jsx
│   ├── NewIncident.jsx
│   ├── Register.jsx
│   ├── Reports.jsx
│   ├── ResetPassword.jsx
│   ├── ResidentDetail.jsx
│   ├── ResidentList.jsx
│   ├── Settings.jsx
│   └── Staff.jsx
├── test/             # Test setup
└── utils/            # Helper functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - All rights reserved

## Support

For support, email support@afhshiel.com or visit our documentation.