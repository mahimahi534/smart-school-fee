import { PrismaClient, Role, StudentStatus, FeeCategory, FeeFrequency, InvoiceStatus, PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Smart School Fee...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const superAdminPassword = await bcrypt.hash('AdminSecurePassword2026!', salt);
  const staffPassword = await bcrypt.hash('Password123!', salt);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartschool.et' },
    update: {},
    create: {
      email: 'superadmin@smartschool.et',
      passwordHash: superAdminPassword,
      fullName: 'Dr. Abebe Kebede',
      fullNameAmharic: 'ዶ/ር አበበ ከበደ',
      phone: '+251911223344',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // 2. Create Sample School
  const school = await prisma.school.upsert({
    where: { code: 'ABYSSINIA' },
    update: {},
    create: {
      code: 'ABYSSINIA',
      name: 'Abyssinia International Academy',
      nameAmharic: 'አቢሲኒያ ዓለም አቀፍ አካዳሚ',
      email: 'info@abyssinia.edu.et',
      phone: '+251116612233',
      address: 'Bole Sub-city, Woreda 03, House 412',
      city: 'Addis Ababa',
      currency: 'ETB',
      studentIdPrefix: 'AF',
      invoicePrefix: 'INV',
      receiptPrefix: 'REC',
      isActive: true,
    },
  });
  console.log('✅ School created:', school.name);

  // 3. Create Branches
  const boleBranch = await prisma.branch.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'BOLE' } },
    update: {},
    create: {
      schoolId: school.id,
      code: 'BOLE',
      name: 'Bole Main Campus',
      nameAmharic: 'ቦሌ ዋና ግቢ',
      phone: '+251116612234',
      email: 'bole@abyssinia.edu.et',
      address: 'Near Edna Mall, Bole',
      city: 'Addis Ababa',
      isMain: true,
      isActive: true,
    },
  });

  const kazanchisBranch = await prisma.branch.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'KAZ' } },
    update: {},
    create: {
      schoolId: school.id,
      code: 'KAZ',
      name: 'Kazanchis Campus',
      nameAmharic: 'ካሳንቺስ ግቢ',
      phone: '+251115514422',
      email: 'kazanchis@abyssinia.edu.et',
      address: 'Behind UNECA, Kazanchis',
      city: 'Addis Ababa',
      isMain: false,
      isActive: true,
    },
  });
  console.log('✅ Branches created: Bole Main & Kazanchis');

  // 4. Create Staff Users with various RBAC roles
  const usersToCreate = [
    {
      email: 'admin@abyssinia.edu.et',
      fullName: 'Tewodros Kassahun',
      fullNameAmharic: 'ቴዎድሮስ ካሳሁን',
      phone: '+251911001122',
      role: Role.SCHOOL_ADMIN,
      branchId: boleBranch.id,
    },
    {
      email: 'bole.admin@abyssinia.edu.et',
      fullName: 'Almaz Ayana',
      fullNameAmharic: 'አልማዝ አያና',
      phone: '+251911334455',
      role: Role.BRANCH_ADMIN,
      branchId: boleBranch.id,
    },
    {
      email: 'registrar@abyssinia.edu.et',
      fullName: 'Mulugeta Tesfaye',
      fullNameAmharic: 'ሙሉጌታ ተስፋዬ',
      phone: '+251911556677',
      role: Role.REGISTRAR,
      branchId: boleBranch.id,
    },
    {
      email: 'cashier@abyssinia.edu.et',
      fullName: 'Hanna Demissie',
      fullNameAmharic: 'ሃና ደሚሴ',
      phone: '+251911778899',
      role: Role.CASHIER,
      branchId: boleBranch.id,
    },
    {
      email: 'accountant@abyssinia.edu.et',
      fullName: 'Yonas Berhanu',
      fullNameAmharic: 'ዮናስ በርሀኑ',
      phone: '+251911990011',
      role: Role.ACCOUNTANT,
      branchId: boleBranch.id,
    },
    {
      email: 'viewer@abyssinia.edu.et',
      fullName: 'Tigist Assefa',
      fullNameAmharic: 'ትዕግስት አሰፋ',
      phone: '+251911442200',
      role: Role.VIEWER,
      branchId: boleBranch.id,
    },
  ];

  const createdUsers = {};
  for (const u of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        schoolId: school.id,
        branchId: u.branchId,
        email: u.email,
        passwordHash: staffPassword,
        fullName: u.fullName,
        fullNameAmharic: u.fullNameAmharic,
        phone: u.phone,
        role: u.role,
        isActive: true,
      },
    });
    createdUsers[u.role] = user;
  }
  console.log('✅ Staff users created for all roles');

  // 5. Academic Year & Terms
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '2026/2027 (2019 E.C.)' } },
    update: {},
    create: {
      schoolId: school.id,
      name: '2026/2027 (2019 E.C.)',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
      isArchived: false,
    },
  });

  const term1 = await prisma.academicTerm.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 1' } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: 'Term 1',
      nameAmharic: 'የመጀመሪያ ሩብ ዓመት (Term 1)',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-11-30'),
      isCurrent: true,
    },
  });

  const term2 = await prisma.academicTerm.upsert({
    where: { academicYearId_name: { academicYearId: academicYear.id, name: 'Term 2' } },
    update: {},
    create: {
      academicYearId: academicYear.id,
      name: 'Term 2',
      nameAmharic: 'ሁለተኛ ሩብ ዓመት (Term 2)',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2027-02-28'),
      isCurrent: false,
    },
  });
  console.log('✅ Academic Year and Terms created');

  // 6. Grades & Sections
  const grade1 = await prisma.grade.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 1' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 1',
      nameAmharic: '1ኛ ክፍል',
      levelOrder: 1,
      description: 'Primary Lower Elementary Grade 1',
    },
  });

  const grade2 = await prisma.grade.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 2' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 2',
      nameAmharic: '2ኛ ክፍል',
      levelOrder: 2,
    },
  });

  const grade9 = await prisma.grade.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Grade 9' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 9',
      nameAmharic: '9ኛ ክፍል',
      levelOrder: 9,
    },
  });

  const sec1ABole = await prisma.classSection.upsert({
    where: { gradeId_branchId_name: { gradeId: grade1.id, branchId: boleBranch.id, name: 'Section A' } },
    update: {},
    create: {
      gradeId: grade1.id,
      branchId: boleBranch.id,
      name: 'Section A',
      capacity: 35,
      roomNumber: 'B-101',
    },
  });

  const sec1BBole = await prisma.classSection.upsert({
    where: { gradeId_branchId_name: { gradeId: grade1.id, branchId: boleBranch.id, name: 'Section B' } },
    update: {},
    create: {
      gradeId: grade1.id,
      branchId: boleBranch.id,
      name: 'Section B',
      capacity: 35,
      roomNumber: 'B-102',
    },
  });

  const sec2AKaz = await prisma.classSection.upsert({
    where: { gradeId_branchId_name: { gradeId: grade2.id, branchId: kazanchisBranch.id, name: 'Section A' } },
    update: {},
    create: {
      gradeId: grade2.id,
      branchId: kazanchisBranch.id,
      name: 'Section A',
      capacity: 30,
      roomNumber: 'K-201',
    },
  });

  const sec9ABole = await prisma.classSection.upsert({
    where: { gradeId_branchId_name: { gradeId: grade9.id, branchId: boleBranch.id, name: 'Section A' } },
    update: {},
    create: {
      gradeId: grade9.id,
      branchId: boleBranch.id,
      name: 'Section A',
      capacity: 40,
      roomNumber: 'B-305',
    },
  });
  console.log('✅ Grades and Sections created');

  // 7. Fee Structures
  const feeTuition = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      gradeId: grade1.id,
      category: FeeCategory.TUITION,
      name: 'Term 1 Tuition - Primary',
      nameAmharic: 'የመጀመሪያ ሩብ ዓመት የትምህርት ክፍያ',
      amount: 8500.00,
      frequency: FeeFrequency.TERM_BASED,
      dueDate: new Date('2026-09-30'),
      description: 'Regular Term 1 tuition for Grades 1-4',
    },
  });

  const feeReg = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      category: FeeCategory.REGISTRATION,
      name: 'Annual Registration Fee',
      nameAmharic: 'ዓመታዊ የምዝገባ ክፍያ',
      amount: 1500.00,
      frequency: FeeFrequency.ANNUAL,
      dueDate: new Date('2026-09-15'),
      description: 'Non-refundable annual student registration',
    },
  });

  const feeTransport = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      category: FeeCategory.TRANSPORT,
      name: 'Term 1 School Bus Transport',
      nameAmharic: 'የትራንስፖርት አገልግሎት ክፍያ',
      amount: 3500.00,
      frequency: FeeFrequency.TERM_BASED,
      dueDate: new Date('2026-09-30'),
      description: 'Two-way daily school bus route service',
    },
  });

  const feeUniform = await prisma.feeStructure.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      category: FeeCategory.UNIFORM,
      name: 'Standard School Uniform Set',
      nameAmharic: 'የደንብ ልብስ (ዩኒፎርም) ክፍያ',
      amount: 2200.00,
      frequency: FeeFrequency.ONE_TIME,
      dueDate: new Date('2026-09-10'),
      description: 'Includes 2 sets of uniform and 1 sports kit',
    },
  });
  console.log('✅ Fee Structures created (Tuition, Registration, Transport, Uniform)');

  // 8. Students, Guardians & Enrollments
  // Student 1: Dawit Bekele
  const dawit = await prisma.student.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentIdNumber: 'AF-0001',
      sequenceNumber: 1,
      firstName: 'Dawit',
      middleName: 'Bekele',
      lastName: 'Mekonnen',
      firstNameAmharic: 'ዳዊት',
      middleNameAmharic: 'በቀለ',
      lastNameAmharic: 'መኮንን',
      gender: 'Male',
      dateOfBirth: new Date('2019-04-12'),
      status: StudentStatus.ACTIVE,
      address: 'Bole Medhanealem, Addis Ababa',
      emergencyPhone: '+251911445566',
      guardians: {
        create: [
          {
            fullName: 'Ato Bekele Mekonnen',
            fullNameAmharic: 'አቶ በቀለ መኮንን',
            relation: 'Father',
            phone: '+251911445566',
            email: 'bekele.m@gmail.com',
            occupation: 'Civil Engineer',
            isPrimary: true,
          },
          {
            fullName: 'W/ro Selamawit Alemu',
            fullNameAmharic: 'ወ/ሮ ሰላማዊት አለሙ',
            relation: 'Mother',
            phone: '+251911889900',
            isPrimary: false,
          },
        ],
      },
      enrollments: {
        create: {
          academicYearId: academicYear.id,
          classSectionId: sec1ABole.id,
          status: StudentStatus.ACTIVE,
        },
      },
    },
  });

  // Student 2: Selamawit Tadesse
  const selamawit = await prisma.student.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentIdNumber: 'AF-0002',
      sequenceNumber: 2,
      firstName: 'Selamawit',
      middleName: 'Tadesse',
      lastName: 'Kebede',
      firstNameAmharic: 'ሰላማዊት',
      middleNameAmharic: 'ታደሰ',
      lastNameAmharic: 'ከበደ',
      gender: 'Female',
      dateOfBirth: new Date('2019-08-23'),
      status: StudentStatus.ACTIVE,
      address: 'Atlas Hotel Area, Addis Ababa',
      emergencyPhone: '+251922334455',
      guardians: {
        create: {
          fullName: 'Tadesse Kebede',
          fullNameAmharic: 'ታደሰ ከበደ',
          relation: 'Father',
          phone: '+251922334455',
          email: 'tadesse.k@yahoo.com',
          isPrimary: true,
        },
      },
      enrollments: {
        create: {
          academicYearId: academicYear.id,
          classSectionId: sec1ABole.id,
          status: StudentStatus.ACTIVE,
        },
      },
    },
  });

  // Student 3: Yohannes Haile (Kazanchis Branch)
  const yohannes = await prisma.student.create({
    data: {
      schoolId: school.id,
      branchId: kazanchisBranch.id,
      studentIdNumber: 'AF-0003',
      sequenceNumber: 3,
      firstName: 'Yohannes',
      middleName: 'Haile',
      lastName: 'Gebrselassie',
      firstNameAmharic: 'ዮሐንስ',
      middleNameAmharic: 'ኃይሌ',
      lastNameAmharic: 'ገብረሥላሴ',
      gender: 'Male',
      dateOfBirth: new Date('2018-02-14'),
      status: StudentStatus.ACTIVE,
      address: 'Kazanchis Menahariya, Addis Ababa',
      emergencyPhone: '+251933556677',
      guardians: {
        create: {
          fullName: 'Haile Gebrselassie',
          fullNameAmharic: 'ኃይሌ ገብረሥላሴ',
          relation: 'Father',
          phone: '+251933556677',
          email: 'haile.g@company.com',
          isPrimary: true,
        },
      },
      enrollments: {
        create: {
          academicYearId: academicYear.id,
          classSectionId: sec2AKaz.id,
          status: StudentStatus.ACTIVE,
        },
      },
    },
  });

  // Student 4: Bethlehem Girma (Overdue sample)
  const bethlehem = await prisma.student.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentIdNumber: 'AF-0004',
      sequenceNumber: 4,
      firstName: 'Bethlehem',
      middleName: 'Girma',
      lastName: 'Woldemariam',
      firstNameAmharic: 'ቤተልሔም',
      middleNameAmharic: 'ግርማ',
      lastNameAmharic: 'ወልደማርያም',
      gender: 'Female',
      dateOfBirth: new Date('2011-10-05'),
      status: StudentStatus.ACTIVE,
      address: 'Bole Rwanda, Addis Ababa',
      emergencyPhone: '+251944778899',
      guardians: {
        create: {
          fullName: 'Girma Woldemariam',
          fullNameAmharic: 'ግርማ ወልደማርያም',
          relation: 'Father',
          phone: '+251944778899',
          isPrimary: true,
        },
      },
      enrollments: {
        create: {
          academicYearId: academicYear.id,
          classSectionId: sec9ABole.id,
          status: StudentStatus.ACTIVE,
        },
      },
    },
  });
  console.log('✅ Students, Guardians, and Enrollments created');

  // 9. Invoices and Payments
  // Invoice 1: Dawit Bekele - Fully Paid (Tuition 8,500 + Registration 1,500 = 10,000 ETB)
  const inv1 = await prisma.invoice.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentId: dawit.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      invoiceNumber: 'INV-2026-0001',
      sequenceNumber: 1,
      issueDate: new Date('2026-09-02'),
      dueDate: new Date('2026-09-30'),
      subtotal: 10000.00,
      discountAmount: 0.00,
      totalAmount: 10000.00,
      paidAmount: 10000.00,
      balanceAmount: 0.00,
      status: InvoiceStatus.PAID,
      items: {
        create: [
          {
            feeStructureId: feeTuition.id,
            feeName: 'Term 1 Tuition - Primary',
            feeNameAmharic: 'የመጀመሪያ ሩብ ዓመት የትምህርት ክፍያ',
            quantity: 1,
            unitAmount: 8500.00,
            discountAmount: 0.00,
            totalAmount: 8500.00,
            paidAmount: 8500.00,
          },
          {
            feeStructureId: feeReg.id,
            feeName: 'Annual Registration Fee',
            feeNameAmharic: 'ዓመታዊ የምዝገባ ክፍያ',
            quantity: 1,
            unitAmount: 1500.00,
            discountAmount: 0.00,
            totalAmount: 1500.00,
            paidAmount: 1500.00,
          },
        ],
      },
    },
  });

  // Payment for Invoice 1
  const payment1 = await prisma.payment.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentId: dawit.id,
      invoiceId: inv1.id,
      receiptNumber: 'REC-2026-0001',
      sequenceNumber: 1,
      amount: 10000.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: 'CBE-TXN-984321774',
      paymentDate: new Date('2026-09-05T10:30:00Z'),
      cashierId: createdUsers[Role.CASHIER].id,
      status: PaymentStatus.COMPLETED,
      idempotencyKey: 'seed_payment_inv1_full',
      notes: 'Paid in full via Commercial Bank of Ethiopia (CBE) transfer.',
      allocations: {
        create: {
          invoiceId: inv1.id,
          amount: 10000.00,
        },
      },
    },
  });

  // Invoice 2: Selamawit Tadesse - Partially Paid (Tuition 8,500 ETB, Paid 5,000 ETB, Balance 3,500 ETB)
  const inv2 = await prisma.invoice.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentId: selamawit.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      invoiceNumber: 'INV-2026-0002',
      sequenceNumber: 2,
      issueDate: new Date('2026-09-05'),
      dueDate: new Date('2026-09-30'),
      subtotal: 8500.00,
      discountAmount: 0.00,
      totalAmount: 8500.00,
      paidAmount: 5000.00,
      balanceAmount: 3500.00,
      status: InvoiceStatus.PARTIALLY_PAID,
      items: {
        create: [
          {
            feeStructureId: feeTuition.id,
            feeName: 'Term 1 Tuition - Primary',
            feeNameAmharic: 'የመጀመሪያ ሩብ ዓመት የትምህርት ክፍያ',
            quantity: 1,
            unitAmount: 8500.00,
            discountAmount: 0.00,
            totalAmount: 8500.00,
            paidAmount: 5000.00,
          },
        ],
      },
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentId: selamawit.id,
      invoiceId: inv2.id,
      receiptNumber: 'REC-2026-0002',
      sequenceNumber: 2,
      amount: 5000.00,
      paymentMethod: PaymentMethod.TELEBIRR,
      referenceNumber: 'TB-89412948',
      paymentDate: new Date('2026-09-12T14:15:00Z'),
      cashierId: createdUsers[Role.CASHIER].id,
      status: PaymentStatus.COMPLETED,
      idempotencyKey: 'seed_payment_inv2_part',
      notes: 'First installment via Telebirr mobile wallet.',
      allocations: {
        create: {
          invoiceId: inv2.id,
          amount: 5000.00,
        },
      },
    },
  });

  // Invoice 3: Yohannes Haile - Unpaid / Issued (Tuition 8,500 + Transport 3,500 = 12,000 ETB)
  const inv3 = await prisma.invoice.create({
    data: {
      schoolId: school.id,
      branchId: kazanchisBranch.id,
      studentId: yohannes.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      invoiceNumber: 'INV-2026-0003',
      sequenceNumber: 3,
      issueDate: new Date('2026-09-10'),
      dueDate: new Date('2026-10-31'),
      subtotal: 12000.00,
      discountAmount: 0.00,
      totalAmount: 12000.00,
      paidAmount: 0.00,
      balanceAmount: 12000.00,
      status: InvoiceStatus.ISSUED,
      items: {
        create: [
          {
            feeStructureId: feeTuition.id,
            feeName: 'Term 1 Tuition - Primary',
            feeNameAmharic: 'የመጀመሪያ ሩብ ዓመት የትምህርት ክፍያ',
            quantity: 1,
            unitAmount: 8500.00,
            discountAmount: 0.00,
            totalAmount: 8500.00,
            paidAmount: 0.00,
          },
          {
            feeStructureId: feeTransport.id,
            feeName: 'Term 1 School Bus Transport',
            feeNameAmharic: 'የትራንስፖርት አገልግሎት ክፍያ',
            quantity: 1,
            unitAmount: 3500.00,
            discountAmount: 0.00,
            totalAmount: 3500.00,
            paidAmount: 0.00,
          },
        ],
      },
    },
  });

  // Invoice 4: Bethlehem Girma - Overdue (Due date was 2026-09-15)
  const inv4 = await prisma.invoice.create({
    data: {
      schoolId: school.id,
      branchId: boleBranch.id,
      studentId: bethlehem.id,
      academicYearId: academicYear.id,
      academicTermId: term1.id,
      invoiceNumber: 'INV-2026-0004',
      sequenceNumber: 4,
      issueDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-15'),
      subtotal: 9000.00,
      discountAmount: 500.00, // Demonstrates scholarship discount
      totalAmount: 8500.00,
      paidAmount: 0.00,
      balanceAmount: 8500.00,
      status: InvoiceStatus.OVERDUE,
      notes: 'Scholarship sibling discount applied (ETB 500.00). Invoice past due date.',
      items: {
        create: [
          {
            feeName: 'Grade 9 High School Tuition Term 1',
            feeNameAmharic: 'የ9ኛ ክፍል ከፍተኛ ሁለተኛ ደረጃ ትምህርት ክፍያ',
            quantity: 1,
            unitAmount: 9000.00,
            discountAmount: 500.00,
            totalAmount: 8500.00,
            paidAmount: 0.00,
          },
        ],
      },
    },
  });
  console.log('✅ Sample Invoices and Payments created (Paid, Partial, Issued, Overdue)');

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        schoolId: school.id,
        branchId: boleBranch.id,
        actorId: createdUsers[Role.SCHOOL_ADMIN].id,
        actorEmail: createdUsers[Role.SCHOOL_ADMIN].email,
        actorName: createdUsers[Role.SCHOOL_ADMIN].fullName,
        actorRole: Role.SCHOOL_ADMIN,
        action: 'SCHOOL_INITIALIZED',
        entityType: 'School',
        entityId: school.id,
        details: JSON.stringify({ schoolName: school.name, branches: ['BOLE', 'KAZ'] }),
      },
      {
        schoolId: school.id,
        branchId: boleBranch.id,
        actorId: createdUsers[Role.CASHIER].id,
        actorEmail: createdUsers[Role.CASHIER].email,
        actorName: createdUsers[Role.CASHIER].fullName,
        actorRole: Role.CASHIER,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment1.id,
        details: JSON.stringify({ amount: 10000.00, method: 'BANK_TRANSFER', receiptNumber: 'REC-2026-0001' }),
      },
    ],
  });

  // 11. Notifications
  await prisma.inAppNotification.createMany({
    data: [
      {
        schoolId: school.id,
        title: 'New Term Invoicing Ready',
        message: 'Term 1 invoices have been generated for 2026/2027 academic year.',
        type: NotificationType.INFO,
        isRead: false,
      },
      {
        schoolId: school.id,
        title: 'Payment Received',
        message: 'Receipt REC-2026-0001 issued for Dawit Bekele (ETB 10,000.00).',
        type: NotificationType.PAYMENT,
        isRead: true,
      },
      {
        schoolId: school.id,
        title: 'Overdue Invoice Alert',
        message: 'Invoice INV-2026-0004 for Bethlehem Girma is overdue.',
        type: NotificationType.WARNING,
        isRead: false,
      },
    ],
  });
  console.log('✅ Audit logs and notifications created');

  console.log('\n🎉 Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
