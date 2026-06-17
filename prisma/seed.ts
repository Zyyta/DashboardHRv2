// =============================================================================
// PeopleView — Seed Script
// Generates realistic HR demo data for 5 departments, 120+ employees
// =============================================================================

import { PrismaClient, Gender, EmployeeStatus, LeaveType, LeaveStatus, TerminationReason, UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Data Pools
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = [
  'Lucas', 'Thomas', 'Antoine', 'Nicolas', 'Maxime', 'Alexandre', 'Julien',
  'Pierre', 'Romain', 'Hugo', 'Mathieu', 'Kevin', 'Adrien', 'Sébastien',
  'Vincent', 'François', 'David', 'Éric', 'Olivier', 'Guillaume',
  'Jean', 'Marc', 'Paul', 'Louis', 'Charles', 'Henri', 'Michel',
  'Yann', 'Fabien', 'Christophe', 'Patrick', 'Cédric', 'Laurent', 'Benoît',
];

const FIRST_NAMES_F = [
  'Marie', 'Camille', 'Julie', 'Sarah', 'Laura', 'Sophie', 'Émilie',
  'Léa', 'Chloé', 'Manon', 'Clara', 'Pauline', 'Anaïs', 'Charlotte',
  'Mélanie', 'Aurélie', 'Nathalie', 'Isabelle', 'Caroline', 'Valérie',
  'Anne', 'Céline', 'Marine', 'Virginie', 'Sandrine', 'Stéphanie',
  'Claire', 'Élise', 'Margaux', 'Lucie', 'Alice', 'Justine',
];

const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
  'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
  'Morel', 'Girard', 'André', 'Lefèvre', 'Mercier', 'Dupont', 'Lambert',
  'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau',
  'Blanc', 'Guérin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
];

const DEPARTMENTS = [
  { name: 'Engineering', color: '#6366f1', positions: ['Développeur Frontend', 'Développeur Backend', 'DevOps Engineer', 'Lead Developer', 'CTO', 'Architecte Logiciel', 'QA Engineer', 'Développeur Full-Stack', 'Data Engineer', 'Développeur Mobile'] },
  { name: 'Marketing', color: '#8b5cf6', positions: ['Responsable Marketing', 'Content Manager', 'SEO Specialist', 'Community Manager', 'Growth Hacker', 'Chef de Produit Marketing', 'Brand Manager', 'Marketing Digital'] },
  { name: 'Sales', color: '#ec4899', positions: ['Account Executive', 'Sales Manager', 'Business Developer', 'Responsable Commercial', 'Inside Sales', 'Key Account Manager', 'Sales Director', 'Customer Success Manager'] },
  { name: 'Finance', color: '#f59e0b', positions: ['Contrôleur de Gestion', 'Comptable', 'DAF', 'Analyste Financier', 'Trésorier', 'Responsable Paie', 'Auditeur Interne'] },
  { name: 'Ressources Humaines', color: '#10b981', positions: ['DRH', 'Chargé de Recrutement', 'Responsable Formation', 'Gestionnaire Paie', 'Responsable RSE', 'HR Business Partner'] },
];

const EMPLOYEE_DISTRIBUTION = [45, 20, 28, 15, 12]; // Per department

const TERMINATION_REASONS: TerminationReason[] = ['RESIGNATION', 'LAYOFF', 'MUTUAL', 'END_OF_CONTRACT', 'RETIREMENT'];

// ---------------------------------------------------------------------------
// Main Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.leaveRecord.deleteMany();
  await prisma.terminationRecord.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🗑️  Cleaned existing data');

  // -------------------------------------------------------------------------
  // Create Organization
  // -------------------------------------------------------------------------
  const org = await prisma.organization.create({
    data: {
      name: 'TechVision SAS',
      slug: 'techvision',
      domain: 'techvision.fr',
    },
  });
  console.log(`🏢 Created organization: ${org.name}`);

  // -------------------------------------------------------------------------
  // Create Subscription
  // -------------------------------------------------------------------------
  await prisma.subscription.create({
    data: {
      plan: SubscriptionPlan.BUSINESS,
      status: SubscriptionStatus.ACTIVE,
      maxEmployees: 100,
      organizationId: org.id,
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    },
  });
  console.log('💳 Created subscription (Business plan)');

  // -------------------------------------------------------------------------
  // Create Users
  // -------------------------------------------------------------------------
  const hashedPassword = await hash('password123', 12);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@peopleview.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
    },
  });

  const orgAdmin = await prisma.user.create({
    data: {
      name: 'Marie Dupont',
      email: 'marie.dupont@techvision.fr',
      password: hashedPassword,
      role: UserRole.ORG_ADMIN,
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      name: 'Lucas Martin',
      email: 'lucas.martin@techvision.fr',
      password: hashedPassword,
      role: UserRole.EMPLOYEE,
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });

  console.log('👤 Created users:');
  console.log(`   Super Admin: admin@peopleview.com`);
  console.log(`   Org Admin:   marie.dupont@techvision.fr`);
  console.log(`   Employee:    lucas.martin@techvision.fr`);
  console.log(`   Password:    password123 (all accounts)`);

  // -------------------------------------------------------------------------
  // Create Departments
  // -------------------------------------------------------------------------
  const departments = [];
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.create({
      data: {
        name: dept.name,
        color: dept.color,
        organizationId: org.id,
        description: `Département ${dept.name} de ${org.name}`,
      },
    });
    departments.push({ ...created, positions: dept.positions });
  }
  console.log(`🏗️  Created ${departments.length} departments`);

  // -------------------------------------------------------------------------
  // Create Employees
  // -------------------------------------------------------------------------
  let totalEmployees = 0;
  const allEmployees: Array<{ id: string; status: EmployeeStatus }> = [];

  for (let deptIdx = 0; deptIdx < departments.length; deptIdx++) {
    const dept = departments[deptIdx];
    const count = EMPLOYEE_DISTRIBUTION[deptIdx];

    for (let i = 0; i < count; i++) {
      const gender: Gender = Math.random() > 0.45 ? 'MALE' : 'FEMALE';
      const firstName = gender === 'MALE' 
        ? randomItem(FIRST_NAMES_M)
        : randomItem(FIRST_NAMES_F);
      const lastName = randomItem(LAST_NAMES);
      
      // Age: 22-58 years old
      const age = randomInt(22, 58);
      const dateOfBirth = new Date(
        new Date().getFullYear() - age,
        randomInt(0, 11),
        randomInt(1, 28)
      );

      // Hire date: between 6 months and 12 years ago
      const hireDate = randomDate(
        new Date(new Date().setFullYear(new Date().getFullYear() - 12)),
        new Date(new Date().setMonth(new Date().getMonth() - 1))
      );

      // ~15% of employees are terminated
      const isTerminated = Math.random() < 0.15;
      const status: EmployeeStatus = isTerminated ? 'TERMINATED' : 
        (Math.random() < 0.05 ? 'ON_LEAVE' : 'ACTIVE');

      // Salary based on department and seniority (with gender gap simulation)
      const baseSalary = dept.name === 'Engineering' ? randomFloat(38000, 75000) :
                         dept.name === 'Marketing'   ? randomFloat(32000, 55000) :
                         dept.name === 'Sales'       ? randomFloat(35000, 65000) :
                         dept.name === 'Finance'     ? randomFloat(36000, 60000) :
                         randomFloat(30000, 52000);
      
      // Slight gender pay gap for realism (2-5%)
      const genderFactor = gender === 'FEMALE' ? randomFloat(0.95, 0.98) : 1.0;
      const salary = Math.round(baseSalary * genderFactor);

      const position = randomItem(dept.positions);
      const email = `${firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}${randomInt(1, 99)}@techvision.fr`;

      const employee = await prisma.employee.create({
        data: {
          firstName,
          lastName,
          email,
          position,
          gender,
          dateOfBirth,
          hireDate,
          salary,
          status,
          organizationId: org.id,
          departmentId: dept.id,
        },
      });

      allEmployees.push({ id: employee.id, status });

      // Create termination record for terminated employees
      if (isTerminated) {
        const terminationDate = randomDate(
          new Date(hireDate.getTime() + 90 * 24 * 60 * 60 * 1000), // At least 3 months after hire
          new Date()
        );
        await prisma.terminationRecord.create({
          data: {
            employeeId: employee.id,
            terminationDate,
            reason: randomItem(TERMINATION_REASONS),
            notes: Math.random() > 0.5 ? 'Départ volontaire' : null,
          },
        });
      }

      totalEmployees++;
    }
  }
  console.log(`👥 Created ${totalEmployees} employees`);

  // -------------------------------------------------------------------------
  // Create Leave Records
  // -------------------------------------------------------------------------
  let leaveCount = 0;
  const activeEmployees = allEmployees.filter(e => e.status !== 'TERMINATED');

  for (const emp of activeEmployees) {
    // Each active employee has 2-6 leave records over the past year
    const numLeaves = randomInt(2, 6);
    for (let i = 0; i < numLeaves; i++) {
      const startDate = randomDate(
        new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        new Date(new Date().setMonth(new Date().getMonth() + 2))
      );
      const days = randomFloat(0.5, 15);
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      const leaveTypes: LeaveType[] = ['VACATION', 'VACATION', 'VACATION', 'SICK', 'SICK', 'OTHER'];
      const statuses: LeaveStatus[] = ['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];

      await prisma.leaveRecord.create({
        data: {
          employeeId: emp.id,
          type: randomItem(leaveTypes),
          status: randomItem(statuses),
          startDate,
          endDate,
          days,
          reason: Math.random() > 0.6 ? 'Congés personnels' : null,
        },
      });
      leaveCount++;
    }
  }
  console.log(`📅 Created ${leaveCount} leave records`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n✅ Seed completed successfully!');
  console.log('─'.repeat(50));
  console.log(`   Organization:  ${org.name}`);
  console.log(`   Departments:   ${departments.length}`);
  console.log(`   Employees:     ${totalEmployees}`);
  console.log(`   Leave Records: ${leaveCount}`);
  console.log(`   Users:         3 (admin + org admin + employee)`);
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
