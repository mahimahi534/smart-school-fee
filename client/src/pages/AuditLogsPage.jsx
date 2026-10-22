import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Eye, Clock, User, Filter } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Card } from '../components/common/Card.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';
import { Pagination } from '../components/common/Pagination.jsx';

export const AuditLogsPage = () => {
  const { t, formatDate } = useLanguage();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        page,
        limit: 20,
        action: actionFilter,
      });
      if (res.success) {
        setLogs(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('navAuditLogs')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable timeline of administrative, financial, and security events
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3">
        <div className="max-w-xs">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="PAYMENT_RECORDED">PAYMENT_RECORDED</option>
            <option value="PAYMENT_REVERSED">PAYMENT_REVERSED</option>
            <option value="INVOICE_CREATED">INVOICE_CREATED</option>
            <option value="STUDENT_REGISTERED">STUDENT_REGISTERED</option>
            <option value="FEE_STRUCTURE_CREATED">FEE_STRUCTURE_CREATED</option>
          </select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-sans">
                    {t('loading')}
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-sans font-semibold">
                      {log.actorName}
                      <span className="block text-[10px] text-slate-400 font-mono">{log.actorEmail}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800 font-sans">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {log.entityType} ({log.entityId || 'N/A'})
                    </td>
                    <td className="py-3 px-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                    <td className="py-3 px-5 text-right font-sans">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="text-xs py-1 px-2 gap-1 text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
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
          onPageChange={(page) => fetchLogs(page)}
        />
      </Card>

      {/* Inspect Modal */}
      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Event Inspection"
        maxWidth="max-w-lg"
      >
        {selectedLog && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-700 font-mono">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="font-semibold text-slate-800">{selectedLog.actorName} ({selectedLog.actorEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Entity:</span>
                <span className="font-mono text-slate-700">{selectedLog.entityType} #{selectedLog.entityId}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Raw Payload Details:</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
              </pre>
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
