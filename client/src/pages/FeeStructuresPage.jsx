import React, { useState, useEffect } from 'react';
import { PlusCircle, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const FeeStructuresPage = () => {
  const { t, formatETB, lang } = useLanguage();

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [grades, setGrades] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    academicYearId: '',
    academicTermId: '',
    gradeId: '',
    category: 'TUITION',
    name: '',
    nameAmharic: '',
    amount: '',
    frequency: 'TERM_BASED',
    dueDate: '',
    description: '',
  });

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees');
      if (res.success) setFees(res.data);
    } catch (err) {
      console.error('Failed to load fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  useEffect(() => {
    const loadSetup = async () => {
      try {
        const [yRes, tRes, gRes] = await Promise.all([
          api.get('/academic/years'),
          api.get('/academic/terms'),
          api.get('/academic/grades'),
        ]);
        if (yRes.success) {
          setAcademicYears(yRes.data);
          const currentYear = yRes.data.find((y) => y.isCurrent) || yRes.data[0];
          if (currentYear) setFormData((prev) => ({ ...prev, academicYearId: currentYear.id }));
        }
        if (tRes.success) setTerms(tRes.data);
        if (gRes.success) setGrades(gRes.data);
      } catch (err) {
        console.error('Failed to load fee configuration dependencies:', err);
      }
    };
    loadSetup();
  }, [isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/fees', {
        ...formData,
        amount: Number(formData.amount),
        academicTermId: formData.academicTermId || null,
        gradeId: formData.gradeId || null,
        dueDate: formData.dueDate || null,
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchFees();
        setFormData({
          academicYearId: formData.academicYearId,
          academicTermId: '',
          gradeId: '',
          category: 'TUITION',
          name: '',
          nameAmharic: '',
          amount: '',
          frequency: 'TERM_BASED',
          dueDate: '',
          description: '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('navFeeStructures')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure tuition rates, registration packages, transport, and facility charges
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shrink-0 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Fee Structure</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            {t('loading')}
          </div>
        ) : fees.length > 0 ? (
          fees.map((fee) => (
            <Card key={fee.id} className="relative hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {fee.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{fee.name}</h3>
                  {fee.nameAmharic && (
                    <p className="text-xs text-slate-500 font-medium">{fee.nameAmharic}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">
                    {formatETB(fee.amount)}
                  </span>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                    {fee.frequency}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Academic Year:</span>
                  <span className="font-medium text-slate-700">{fee.academicYear?.name}</span>
                </div>
                {fee.academicTerm && (
                  <div className="flex justify-between">
                    <span>Term:</span>
                    <span className="font-medium text-slate-700">{fee.academicTerm.name}</span>
                  </div>
                )}
                {fee.grade && (
                  <div className="flex justify-between">
                    <span>Grade Scope:</span>
                    <span className="font-medium text-slate-700">{fee.grade.name}</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            No fee structures defined yet.
          </div>
        )}
      </div>

      {/* Create Fee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Fee Structure"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fee Title (English) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Term 1 Tuition - Primary"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fee Title (Amharic)
              </label>
              <input
                type="text"
                value={formData.nameAmharic}
                onChange={(e) => setFormData({ ...formData, nameAmharic: e.target.value })}
                placeholder="ምሳሌ: የመጀመሪያ ሩብ ዓመት ክፍያ"
                className="w-full p-2 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="TUITION">Tuition (የትምህርት ክፍያ)</option>
                <option value="REGISTRATION">Registration (ምዝገባ)</option>
                <option value="TRANSPORT">Transport (ትራንስፖርት)</option>
                <option value="UNIFORM">Uniform (ዩኒፎርም)</option>
                <option value="EXAMINATION">Examination (ፈተና)</option>
                <option value="MEAL">Meal (ምግብ)</option>
                <option value="FACILITY">Facility (መገልገያ)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (ETB) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="8500.00"
                className="w-full p-2 text-xs border border-slate-300 rounded-md font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
              >
                <option value="TERM_BASED">Term-Based</option>
                <option value="ANNUAL">Annual</option>
                <option value="MONTHLY">Monthly</option>
                <option value="ONE_TIME">One-Time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Term
              </label>
              <select
                value={formData.academicTermId}
                onChange={(e) => setFormData({ ...formData, academicTermId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="">All Terms</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grade Scope
              </label>
              <select
                value={formData.gradeId}
                onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="">All Grades</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Save Fee Structure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
