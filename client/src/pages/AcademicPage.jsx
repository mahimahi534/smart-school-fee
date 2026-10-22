import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, GraduationCap, Layers, Check } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const AcademicPage = () => {
  const { t, formatDate } = useLanguage();

  const [activeTab, setActiveTab] = useState('years'); // 'years', 'terms', 'grades', 'sections'
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalType, setModalType] = useState(null); // 'year', 'term', 'grade', 'section'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [yearForm, setYearForm] = useState({ name: '', startDate: '2026-09-01', endDate: '2027-06-30', isCurrent: true });
  const [termForm, setTermForm] = useState({ academicYearId: '', name: '', nameAmharic: '', startDate: '2026-09-01', endDate: '2026-11-30', isCurrent: false });
  const [gradeForm, setGradeForm] = useState({ name: '', nameAmharic: '', levelOrder: 1, description: '' });
  const [sectionForm, setSectionForm] = useState({ gradeId: '', branchId: '', name: 'Section A', capacity: 35 });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [yRes, tRes, gRes, sRes, bRes] = await Promise.all([
        api.get('/academic/years'),
        api.get('/academic/terms'),
        api.get('/academic/grades'),
        api.get('/academic/sections'),
        api.get('/schools/branches'),
      ]);
      if (yRes.success) setYears(yRes.data);
      if (tRes.success) setTerms(tRes.data);
      if (gRes.success) setGrades(gRes.data);
      if (sRes.success) setSections(sRes.data);
      if (bRes.success) setBranches(bRes.data);

      if (yRes.data?.[0]) setTermForm((prev) => ({ ...prev, academicYearId: yRes.data[0].id }));
      if (gRes.data?.[0]) setSectionForm((prev) => ({ ...prev, gradeId: gRes.data[0].id }));
      if (bRes.data?.[0]) setSectionForm((prev) => ({ ...prev, branchId: bRes.data[0].id }));
    } catch (err) {
      console.error('Failed to load academic setup:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateYear = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/academic/years', yearForm);
      if (res.success) {
        setModalType(null);
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to create year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTerm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/academic/terms', termForm);
      if (res.success) {
        setModalType(null);
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to create term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGrade = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/academic/grades', {
        ...gradeForm,
        levelOrder: Number(gradeForm.levelOrder),
      });
      if (res.success) {
        setModalType(null);
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to create grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/academic/sections', {
        ...sectionForm,
        capacity: Number(sectionForm.capacity),
      });
      if (res.success) {
        setModalType(null);
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to create section');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('navAcademic')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage academic years, terms, grade levels, and classroom sections
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'years' && (
            <Button variant="primary" size="sm" onClick={() => setModalType('year')} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Add Year</span>
            </Button>
          )}
          {activeTab === 'terms' && (
            <Button variant="primary" size="sm" onClick={() => setModalType('term')} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Add Term</span>
            </Button>
          )}
          {activeTab === 'grades' && (
            <Button variant="primary" size="sm" onClick={() => setModalType('grade')} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Add Grade</span>
            </Button>
          )}
          {activeTab === 'sections' && (
            <Button variant="primary" size="sm" onClick={() => setModalType('section')} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Add Section</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        {[
          { key: 'years', label: 'Academic Years', count: years.length },
          { key: 'terms', label: 'Terms / Semesters', count: terms.length },
          { key: 'grades', label: 'Grade Levels', count: grades.length },
          { key: 'sections', label: 'Class Sections', count: sections.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 border-b-2 font-bold transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 1: Years */}
      {activeTab === 'years' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Year Name</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {years.map((y) => (
                <tr key={y.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-bold text-slate-900">{y.name}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(y.startDate)}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(y.endDate)}</td>
                  <td className="py-3 px-4">
                    {y.isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        Active Current Year
                      </span>
                    ) : (
                      <span className="text-slate-400">Archived / Past</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 2: Terms */}
      {activeTab === 'terms' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Term Name</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-bold text-slate-900">
                    {t.name}
                    {t.nameAmharic && <span className="block text-slate-500 font-normal">{t.nameAmharic}</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{t.academicYear?.name}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(t.startDate)}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(t.endDate)}</td>
                  <td className="py-3 px-4">
                    {t.isCurrent ? <Badge variant="success">Current Term</Badge> : <span className="text-slate-400">Regular</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 3: Grades */}
      {activeTab === 'grades' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Grade Level</th>
                <th className="py-3 px-4">Amharic Name</th>
                <th className="py-3 px-4">Level Order</th>
                <th className="py-3 px-4">Sections Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grades.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-bold text-slate-900">{g.name}</td>
                  <td className="py-3 px-4 text-slate-600">{g.nameAmharic || '-'}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{g.levelOrder}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{g.classSections?.length || 0} sections</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 4: Sections */}
      {activeTab === 'sections' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Section Name</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">Campus / Branch</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">{s.grade?.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.branch?.name}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{s.capacity} students</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold font-mono">{s._count?.enrollments || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Year Modal */}
      <Modal isOpen={modalType === 'year'} onClose={() => setModalType(null)} title="Add Academic Year" maxWidth="max-w-md">
        <form onSubmit={handleCreateYear} className="space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year Name (e.g. 2026/2027) *</label>
            <input type="text" required value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" placeholder="2027/2028 (2020 E.C.)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input type="date" required value={yearForm.startDate} onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input type="date" required value={yearForm.endDate} onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Year</Button>
          </div>
        </form>
      </Modal>

      {/* Term Modal */}
      <Modal isOpen={modalType === 'term'} onClose={() => setModalType(null)} title="Add Term / Semester" maxWidth="max-w-md">
        <form onSubmit={handleCreateTerm} className="space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
            <select required value={termForm.academicYearId} onChange={(e) => setTermForm({ ...termForm, academicYearId: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded bg-white">
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Term Name (English) *</label>
            <input type="text" required value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} placeholder="Term 3 / Quarter 3" className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input type="date" required value={termForm.startDate} onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input type="date" required value={termForm.endDate} onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Term</Button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={modalType === 'grade'} onClose={() => setModalType(null)} title="Add Grade Level" maxWidth="max-w-md">
        <form onSubmit={handleCreateGrade} className="space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grade Name (e.g. Grade 5) *</label>
            <input type="text" required value={gradeForm.name} onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })} placeholder="Grade 5" className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amharic Name</label>
            <input type="text" value={gradeForm.nameAmharic} onChange={(e) => setGradeForm({ ...gradeForm, nameAmharic: e.target.value })} placeholder="5ኛ ክፍል" className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Level Order (Sort sequence) *</label>
            <input type="number" required value={gradeForm.levelOrder} onChange={(e) => setGradeForm({ ...gradeForm, levelOrder: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Grade</Button>
          </div>
        </form>
      </Modal>

      {/* Section Modal */}
      <Modal isOpen={modalType === 'section'} onClose={() => setModalType(null)} title="Add Class Section" maxWidth="max-w-md">
        <form onSubmit={handleCreateSection} className="space-y-4">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Grade *</label>
            <select required value={sectionForm.gradeId} onChange={(e) => setSectionForm({ ...sectionForm, gradeId: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded bg-white">
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Branch *</label>
            <select required value={sectionForm.branchId} onChange={(e) => setSectionForm({ ...sectionForm, branchId: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded bg-white">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Section Name *</label>
            <input type="text" required value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Section A" className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity (Max Students) *</label>
            <input type="number" required value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: e.target.value })} className="w-full p-2 text-xs border border-slate-300 rounded" />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Section</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
