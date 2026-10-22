import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Eye, Filter, Phone, UserCheck } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Pagination } from '../components/common/Pagination.jsx';

export const StudentsPage = () => {
  const { t, lang } = useLanguage();
  const { hasRole } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Registration modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    branchId: '',
    academicYearId: '',
    classSectionId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    firstNameAmharic: '',
    middleNameAmharic: '',
    lastNameAmharic: '',
    gender: 'Male',
    dateOfBirth: '2018-01-01',
    emergencyPhone: '+251',
    address: 'Addis Ababa',
    guardian: {
      fullName: '',
      fullNameAmharic: '',
      relation: 'Father',
      phone: '+251',
      email: '',
    },
  });

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        page,
        limit: 15,
        search,
        status: statusFilter,
        branchId: branchFilter,
      });
      if (res.success) {
        setStudents(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(1);
  }, [search, statusFilter, branchFilter]);

  // Load auxiliary data for modal
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [bRes, yRes, gRes, sRes] = await Promise.all([
          api.get('/schools/branches'),
          api.get('/academic/years'),
          api.get('/academic/grades'),
          api.get('/academic/sections'),
        ]);

        if (bRes.success) setBranches(bRes.data);
        if (yRes.success) setAcademicYears(yRes.data);
        if (gRes.success) setGrades(gRes.data);
        if (sRes.success) setSections(sRes.data);

        // Preselect active defaults
        if (bRes.data?.[0]) setFormData((prev) => ({ ...prev, branchId: bRes.data[0].id }));
        const activeYear = yRes.data?.find((y) => y.isCurrent) || yRes.data?.[0];
        if (activeYear) setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }));
        if (sRes.data?.[0]) setFormData((prev) => ({ ...prev, classSectionId: sRes.data[0].id }));
      } catch (err) {
        console.error('Failed to fetch setup data for student form:', err);
      }
    };
    loadSetupData();
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const res = await api.post('/students', formData);
      if (res.success) {
        setIsRegisterOpen(false);
        fetchStudents(1);
        // Reset basic fields
        setFormData((prev) => ({
          ...prev,
          firstName: '',
          middleName: '',
          lastName: '',
          firstNameAmharic: '',
          middleNameAmharic: '',
          lastNameAmharic: '',
          guardian: { ...prev.guardian, fullName: '', phone: '+251' },
        }));
      }
    } catch (err) {
      setFormError(err.message || 'Failed to register student');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('studentsList')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered students, enrollments, and academic identities
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'REGISTRAR') && (
          <Button
            variant="primary"
            onClick={() => setIsRegisterOpen(true)}
            className="gap-2 shrink-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('registerStudent')}</span>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
            >
              <option value="">{t('allBranches')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
            >
              <option value="">{t('all')} Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
              <option value="GRADUATED">GRADUATED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-5">{t('studentId')}</th>
                <th className="py-3 px-4">{t('fullName')}</th>
                <th className="py-3 px-4">{t('branch')}</th>
                <th className="py-3 px-4">{t('grade')} & {t('classSection')}</th>
                <th className="py-3 px-4">{t('guardianPhone')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-5 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => {
                  const studentName =
                    lang === 'am' && student.firstNameAmharic
                      ? `${student.firstNameAmharic} ${student.lastNameAmharic || ''}`
                      : `${student.firstName} ${student.middleName || ''} ${student.lastName}`;

                  const enrollment = student.enrollments?.[0];
                  const gradeSection = enrollment?.classSection
                    ? `${enrollment.classSection.grade?.name} (${enrollment.classSection.name})`
                    : 'Unassigned';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {student.studentIdNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {studentName}
                        {lang !== 'am' && student.firstNameAmharic && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            {student.firstNameAmharic} {student.lastNameAmharic}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{student.branch?.name}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{gradeSection}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {student.guardians?.[0]?.phone || student.emergencyPhone}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge>{student.status}</Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link to={`/students/${student.id}`}>
                          <Button variant="secondary" size="sm" className="gap-1 py-1 px-2.5 text-xs">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('view')} Ledger</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => fetchStudents(page)}
        />
      </Card>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title={t('registerStudent')}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {formError}
            </div>
          )}

          {/* Academic & Branch selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {t('branch')} *
              </label>
              <select
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Academic Year *
              </label>
              <select
                required
                value={formData.academicYearId}
                onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Grade & Section *
              </label>
              <select
                required
                value={formData.classSectionId}
                onChange={(e) => setFormData({ ...formData, classSectionId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.grade?.name} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Names in English */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('firstName')} *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Dawit"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('middleName')}
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                placeholder="e.g. Bekele"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('lastName')} *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Mekonnen"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          {/* Names in Amharic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ስም (First Name in Amharic)
              </label>
              <input
                type="text"
                value={formData.firstNameAmharic}
                onChange={(e) => setFormData({ ...formData, firstNameAmharic: e.target.value })}
                placeholder="ምሳሌ: ዳዊት"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                የአባት ስም (Father)
              </label>
              <input
                type="text"
                value={formData.middleNameAmharic}
                onChange={(e) => setFormData({ ...formData, middleNameAmharic: e.target.value })}
                placeholder="ምሳሌ: በቀለ"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                የአያት ስም (Grandfather)
              </label>
              <input
                type="text"
                value={formData.lastNameAmharic}
                onChange={(e) => setFormData({ ...formData, lastNameAmharic: e.target.value })}
                placeholder="ምሳሌ: መኮንን"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('gender')} *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('emergencyPhone')} *
              </label>
              <input
                type="text"
                required
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="+251 911 000000"
                className="w-full p-2 text-xs border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          {/* Primary Guardian Details */}
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
              Primary Parent / Guardian Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('guardianName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardian.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardian: { ...formData.guardian, fullName: e.target.value },
                    })
                  }
                  placeholder="e.g. Bekele Mekonnen"
                  className="w-full p-2 text-xs border border-slate-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('guardianRelation')} *
                </label>
                <select
                  value={formData.guardian.relation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardian: { ...formData.guardian, relation: e.target.value },
                    })
                  }
                  className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
                >
                  <option value="Father">Father (አባት)</option>
                  <option value="Mother">Mother (እናት)</option>
                  <option value="Guardian">Legal Guardian (አሳዳጊ)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('guardianPhone')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.guardian.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardian: { ...formData.guardian, phone: e.target.value },
                    })
                  }
                  placeholder="+251 911 223344"
                  className="w-full p-2 text-xs border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsRegisterOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={formSubmitting}>
              {t('save')} & Generate ID
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
