// =============================================================================
// Shared types for the HR Analytics Dashboard
// =============================================================================

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  turnoverRate: number;
  absenteeismRate: number;
  averageTenure: number;
  departmentDistribution: DepartmentDistribution[];
  monthlyHeadcount: MonthlyHeadcount[];
  monthlyTurnover: MonthlyTurnover[];
  agePyramid: AgePyramidData[];
  genderDistribution: GenderDistribution[];
  monthlyAbsence: MonthlyAbsence[];
  salaryEquity: SalaryEquity[];
}

export interface DepartmentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyHeadcount {
  month: string;
  embauches: number;
  departs: number;
}

export interface MonthlyTurnover {
  month: string;
  taux: number;
  moyenne: number;
}

export interface AgePyramidData {
  tranche: string;
  hommes: number;
  femmes: number;
}

export interface GenderDistribution {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyAbsence {
  month: string;
  taux: number;
}

export interface SalaryEquity {
  dept: string;
  hommes: number;
  femmes: number;
}

export interface KpiCardData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  description: string;
}
