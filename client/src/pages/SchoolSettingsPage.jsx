import React, { useState, useEffect } from 'react';
import { Building, PlusCircle, Shield, Check, UserPlus, Power } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const SchoolSettingsPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'branches', 'staff'
  const [school, setSchool] = useState(null);
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Branch modal
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ code: '', name: '', nameAmharic: '', phone: '', email: '', address: '', isMain: false });

  // Staff modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    email: '',
    password: '',
    fullName: '',
    fullNameAmharic: '',
    phone: '',
    role: 'CASHIER',
    branchId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes, uRes] = await Promise.all([
        api.get('/schools/current'),
        api.get('/schools/branches'),
        api.get('/schools/staff'),
      ]);
      if (sRes.success) setSchool(sRes.data);
      if (bRes.success) {
        setBranches(bRes.data);
        if (bRes.data?.[0]) setStaffForm((prev) => ({ ...prev, branchId: bRes.data[0].id }));
      }
      if (uRes.success) setStaff(uRes.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSchool = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/schools/current', school);
      if (res.success) {
        setMessage('School profile updated successfully.');
        setSchool(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/schools/branches', branchForm);
      if (res.success) {
        setIsBranchModalOpen(false);
        setBranchForm({ code: '', name: '', nameAmharic: '', phone: '', email: '', address: '', isMain: false });
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/schools/staff', staffForm);
      if (res.success) {
        setIsStaffModalOpen(false);
        setStaffForm({ email: '', password: '', fullName: '', fullNameAmharic: '', phone: '', role: 'CASHIER', branchId: branches[0]?.id || '' });
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStaff = async (staffId) => {
    try {
      const res = await api.patch(`/schools/staff/${staffId}/toggle-status`);
      if (res.success) loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle staff status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('navStaff')} & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure institutional identities, campuses, and RBAC user permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'branches' && (
            <Button variant="primary" size="sm" onClick={() => setIsBranchModalOpen(true)} className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Add Branch</span>
            </Button>
          )}
          {activeTab === 'staff' && (
            <Button variant="primary" size="sm" onClick={() => setIsStaffModalOpen(true)} className="gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Add Staff User</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4 text-xs font-semibold">
        {[
          { key: 'profile', label: 'School Identity Profile' },
          { key: 'branches', label: 'Campuses & Branches' },
          { key: 'staff', label: 'Staff Accounts & Roles' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 border-b-2 font-bold transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && school && (
        <Card title="School Official Profile" subtitle="Used on printed receipts, fee invoices, and official reports">
          {message && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg mb-4 border border-emerald-200">{message}</div>}
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg mb-4 border border-rose-200">{error}</div>}

          <form onSubmit={handleUpdateSchool} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Legal Name (English) *</label>
                <input type="text" required value={school.name || ''} onChange={(e) => setSchool({ ...school, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md font-bold text-slate-900" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">የትምህርት ቤቱ ስም (Amharic Name)</label>
                <input type="text" value={school.nameAmharic || ''} onChange={(e) => setSchool({ ...school, nameAmharic: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md font-semibold text-slate-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                <input type="email" required value={school.email || ''} onChange={(e) => setSchool({ ...school, email: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Phone *</label>
                <input type="text" required value={school.phone || ''} onChange={(e) => setSchool({ ...school, phone: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md font-mono" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campus Address & City *</label>
              <input type="text" required value={school.address || ''} onChange={(e) => setSchool({ ...school, address: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-md" />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Automated Numbering Prefixes</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Student ID Prefix</label>
                  <input type="text" value={school.studentIdPrefix || 'AF'} onChange={(e) => setSchool({ ...school, studentIdPrefix: e.target.value })} className="w-full p-2 border border-slate-300 rounded font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Invoice Prefix</label>
                  <input type="text" value={school.invoicePrefix || 'INV'} onChange={(e) => setSchool({ ...school, invoicePrefix: e.target.value })} className="w-full p-2 border border-slate-300 rounded font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Receipt Prefix</label>
                  <input type="text" value={school.receiptPrefix || 'REC'} onChange={(e) => setSchool({ ...school, receiptPrefix: e.target.value })} className="w-full p-2 border border-slate-300 rounded font-mono font-bold" />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <Button type="submit" variant="primary" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tab 2: Branches */}
      {activeTab === 'branches' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Code</th>
                <th className="py-3 px-4">Campus Name</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Students Enrolled</th>
                <th className="py-3 px-4">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5 font-mono font-bold text-slate-900">{b.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {b.name}
                    {b.nameAmharic && <span className="block text-slate-400 font-normal">{b.nameAmharic}</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{b.address}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{b.phone}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700 font-mono">{b._count?.students || 0} students</td>
                  <td className="py-3 px-4">
                    {b.isMain ? <Badge variant="success">Main Headquarters</Badge> : <Badge>Branch</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 3: Staff Users */}
      {activeTab === 'staff' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-5">Full Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Campus</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    {s.fullName}
                    {s.fullNameAmharic && <span className="block text-slate-500 font-normal">{s.fullNameAmharic}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{s.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{s.branch?.name || 'All Campuses'}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={s.isActive ? 'success' : 'danger'}>
                      {s.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {s.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleStaff(s.id)}
                        className="py-1 px-2 text-[11px] gap-1"
                      >
                        <Power className="w-3 h-3 text-slate-400" />
                        <span>{s.isActive ? 'Deactivate' : 'Activate'}</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Branch Modal */}
      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title="Add Campus / Branch" maxWidth="max-w-md">
        <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded border border-rose-200">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Branch Code (e.g. BOLE) *</label>
              <input type="text" required value={branchForm.code} onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })} placeholder="BOLE" className="w-full p-2 border border-slate-300 rounded font-mono uppercase font-bold" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Campus Name *</label>
              <input type="text" required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} placeholder="Bole Main Campus" className="w-full p-2 border border-slate-300 rounded" />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1">Campus Name (Amharic)</label>
            <input type="text" value={branchForm.nameAmharic} onChange={(e) => setBranchForm({ ...branchForm, nameAmharic: e.target.value })} placeholder="ቦሌ ዋና ግቢ" className="w-full p-2 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone Number *</label>
            <input type="text" required value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="+251 11 661 2234" className="w-full p-2 border border-slate-300 rounded font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Physical Address *</label>
            <input type="text" required value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Bole Medhanealem" className="w-full p-2 border border-slate-300 rounded" />
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsBranchModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Save Branch</Button>
          </div>
        </form>
      </Modal>

      {/* Add Staff Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Create Staff Account" maxWidth="max-w-md">
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded border border-rose-200">{error}</div>}
          <div>
            <label className="block font-semibold mb-1">Institutional Email Address *</label>
            <input type="email" required value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="name@abyssinia.edu.et" className="w-full p-2 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Initial Password *</label>
            <input type="password" required value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="••••••••••••" className="w-full p-2 border border-slate-300 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Full Name (English) *</label>
              <input type="text" required value={staffForm.fullName} onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })} placeholder="Abebe Kebede" className="w-full p-2 border border-slate-300 rounded" />
            </div>
            <div>
              <label className="block font-semibold mb-1">ስም (Amharic)</label>
              <input type="text" value={staffForm.fullNameAmharic} onChange={(e) => setStaffForm({ ...staffForm, fullNameAmharic: e.target.value })} placeholder="አበበ ከበደ" className="w-full p-2 border border-slate-300 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Assigned Role *</label>
              <select required value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full p-2 border border-slate-300 rounded bg-white font-medium">
                <option value="SCHOOL_ADMIN">School Admin</option>
                <option value="BRANCH_ADMIN">Branch Admin</option>
                <option value="CASHIER">Cashier (ገንዘብ ተቀባይ)</option>
                <option value="ACCOUNTANT">Accountant (አካውንታንት)</option>
                <option value="REGISTRAR">Registrar (ሬጅስትራር)</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Assigned Campus</label>
              <select value={staffForm.branchId} onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })} className="w-full p-2 border border-slate-300 rounded bg-white">
                <option value="">All Campuses</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Create Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
