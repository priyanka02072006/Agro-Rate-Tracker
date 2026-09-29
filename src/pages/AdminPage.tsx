import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { UserProfile } from '../types/client.js';
import {
  Settings,
  RefreshCw,
  Database,
  Sliders,
  Users,
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckCircle,
  Cloud,
  Copy,
  ExternalLink,
  Key,
  Server,
  Terminal,
  Layers,
  Table,
  Check,
  Zap,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [supabaseInfo, setSupabaseInfo] = useState<any>(null);
  const [hanaInfo, setHanaInfo] = useState<any>(null);
  const [hanaDatasets, setHanaDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('executive_dashboard');
  const [hanaSchemaSql, setHanaSchemaSql] = useState<string | null>(null);
  const [showHanaModal, setShowHanaModal] = useState(false);
  const [testingHana, setTestingHana] = useState(false);
  const [hanaTestResult, setHanaTestResult] = useState<any>(null);
  const [schemaSql, setSchemaSql] = useState<string | null>(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedHanaSql, setCopiedHanaSql] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rejects, setRejects] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [liveHanaTables, setLiveHanaTables] = useState<Array<{ name: string; recordCount: number }>>([]);
  const [liveHanaViews, setLiveHanaViews] = useState<string[]>([]);
  const [syncingHana, setSyncingHana] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAdminData = () => {
    Promise.all([
      api.getSyncStatus(),
      api.getSupabaseStatus(),
      api.getHanaStatus().catch(() => null),
      api.getHanaDatasets().catch(() => null),
      api.getHanaLiveTables().catch(() => null),
      api.getSettings(),
      api.getAdminUsers(),
      api.getRejectedRows(),
    ])
      .then(([sRes, supaRes, hRes, hdRes, hLiveRes, setRes, uRes, rRes]) => {
        setSyncStatus(sRes);
        setSupabaseInfo(supaRes);
        if (hRes) {
          setHanaInfo(hRes);
          if (hRes.connection) setHanaTestResult(hRes.connection);
        }
        if (hdRes?.datasets) {
          setHanaDatasets(hdRes.datasets);
        }
        if (hLiveRes?.tables) {
          setLiveHanaTables(hLiveRes.tables);
          setLiveHanaViews(hLiveRes.views || []);
        }
        setSettings(setRes.settings);
        setUsers(uRes.users);
        setRejects(rRes.rejects);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSyncHana = async () => {
    setSyncingHana(true);
    setMessage(null);
    try {
      const res = await api.syncHana();
      setMessage(res.message);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'SAP HANA sync failed');
    } finally {
      setSyncingHana(false);
    }
  };

  const handleTestHana = async () => {
    setTestingHana(true);
    setHanaTestResult(null);
    try {
      const res = await api.testHanaConnection();
      setHanaTestResult(res);
      if (res.success) {
        setMessage(`SAP HANA Cloud Ping: Connected in ${res.latencyMs || 0}ms.`);
      } else {
        setMessage(`SAP HANA Cloud: ${res.message}`);
      }
    } catch (err: any) {
      setHanaTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTestingHana(false);
    }
  };

  const handleViewHanaSchema = async () => {
    try {
      const res = await api.getHanaSchema();
      setHanaSchemaSql(res.sql);
      setShowHanaModal(true);
    } catch (err: any) {
      alert('Could not fetch SAP HANA schema SQL: ' + err.message);
    }
  };

  const handleDownloadHanaDump = async () => {
    try {
      const res = await api.getHanaExportDump();
      const blob = new Blob([res.sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hana_schema_${hanaInfo?.config?.schema || '07083DD5224243A8B73B330781FE33B6'}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('SAP HANA Cloud SQL dump downloaded successfully.');
    } catch (err: any) {
      alert('Could not export HANA dump: ' + err.message);
    }
  };

  const handleCopyHanaSql = () => {
    if (hanaSchemaSql) {
      navigator.clipboard.writeText(hanaSchemaSql);
      setCopiedHanaSql(true);
      setTimeout(() => setCopiedHanaSql(false), 2000);
    }
  };

  const handleCopyDatasetQuery = (viewName: string) => {
    const query = `SELECT * FROM ${viewName} LIMIT 50;`;
    navigator.clipboard.writeText(query);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleSyncSupabase = async () => {
    setSyncingSupabase(true);
    setMessage(null);
    try {
      const res = await api.syncSupabase();
      setMessage(res.message);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Supabase sync failed');
    } finally {
      setSyncingSupabase(false);
    }
  };

  const handleViewSchema = async () => {
    try {
      const res = await api.getSupabaseSchema();
      setSchemaSql(res.sql);
      setShowSchemaModal(true);
    } catch (err: any) {
      alert('Could not fetch schema SQL: ' + err.message);
    }
  };

  const handleCopySql = () => {
    if (schemaSql) {
      navigator.clipboard.writeText(schemaSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await api.syncNow();
      setMessage(res.message);
      loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSettings(settings);
      setMessage('System parameters and matching weights saved successfully.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      loadAdminData();
      setMessage(`Updated user role to ${newRole}.`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentDataset = hanaDatasets.find((d) => d.dashboardId === selectedDatasetId) || hanaDatasets[0];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900">
              {t('nav.admin')}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900 text-white font-bold">
              Directorate Admin Console
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Control Agmarknet ingestion pipeline, SAP HANA Cloud MCP datasets, and system configuration
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-100 text-emerald-900 p-3 rounded-lg text-xs font-semibold flex items-center justify-between border border-emerald-300">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAP HANA CLOUD ENTERPRISE MCP INTEGRATION CARD                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              HANA
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-neutral-900">SAP HANA Cloud & MCP Server Integration</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold border border-blue-300 flex items-center gap-1 font-mono">
                  hana-mcp-server
                </span>
                {hanaTestResult?.success ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                    TLS Connected ({hanaTestResult?.latencyMs || 0}ms)
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    MCP Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enterprise In-Memory Column Store for analytical datasets, price forecasting, and cross-mandi aggregation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestHana}
              disabled={testingHana}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 ${testingHana ? 'animate-spin' : ''}`} />
              <span>{testingHana ? 'Testing TLS...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleViewHanaSchema}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-blue-700" />
              <span>View HANA DDL Schema</span>
            </button>

            <button
              onClick={handleDownloadHanaDump}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export DDL SQL</span>
            </button>

            <button
              onClick={handleSyncHana}
              disabled={syncingHana}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingHana ? 'animate-spin' : ''}`} />
              <span>{syncingHana ? 'Syncing to HANA...' : 'Sync Live Data to HANA'}</span>
            </button>
          </div>
        </div>

        {/* Live SAP HANA Cloud Tables Banner */}
        {liveHanaTables.length > 0 && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Verified Tables Active in SAP HANA Cloud ({liveHanaTables.length} Tables, {liveHanaViews.length} Views):</span>
              </span>
              <span className="text-[10px] text-blue-700 font-mono">
                Schema: {hanaInfo?.config?.schema || '07083DD5224243A8B73B330781FE33B6_847HZDGM0TBWSQYB0KH9O3B61_DT'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {liveHanaTables.map((t) => (
                <span
                  key={t.name}
                  className="px-2 py-0.5 rounded-lg bg-white border border-blue-200 text-blue-900 font-mono text-[10px] font-medium shadow-2xs"
                >
                  {t.name} <strong className="text-emerald-700">({t.recordCount})</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MCP Connection Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">HANA Host Endpoint</span>
            <div className="font-mono text-[11px] text-neutral-800 font-semibold truncate" title={hanaInfo?.config?.host}>
              {hanaInfo?.config?.host || 'ec7fe24b-6072-4ecf-8ef2-1c4675a544fc.hana...'}
            </div>
            <span className="text-[10px] text-neutral-500">Port: {hanaInfo?.config?.port || 443} · SSL Active</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">HANA User & Schema</span>
            <div className="font-mono text-[11px] text-blue-950 font-bold truncate">
              {hanaInfo?.config?.schema || '07083DD5224243A8B73B330781FE33B6'}
            </div>
            <span className="text-[10px] text-neutral-500 truncate block">User: {hanaInfo?.config?.userMasked}</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">MCP Server Status</span>
            <div className="font-mono text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>npx -y hana-mcp-server</span>
            </div>
            <span className="text-[10px] text-neutral-500">Standard MCP JSON Protocol</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Dashboard Datasets</span>
            <div className="font-bold text-sm text-neutral-900">
              {hanaDatasets.length || 13} Dedicated Datasets
            </div>
            <span className="text-[10px] text-emerald-700">Aligned with every UI dashboard</span>
          </div>
        </div>

        {/* Live TLS Handshake Result */}
        {hanaTestResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              hanaTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {hanaTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-mono">{hanaTestResult.message}</span>
            </div>
            {hanaTestResult.latencyMs !== undefined && (
              <span className="px-2 py-0.5 rounded bg-white font-mono text-[10px] font-bold text-neutral-700 border border-neutral-200">
                {hanaTestResult.latencyMs}ms
              </span>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DASHBOARD DATASETS EXPLORER ACCORDION / TABS                             */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-neutral-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-800" />
                <span>Dashboard Datasets Catalog (SAP HANA Column Views)</span>
              </h3>
              <p className="text-[11px] text-neutral-500">
                Specialized analytical datasets pre-aggregated in SAP HANA Cloud for each dashboard route.
              </p>
            </div>
          </div>

          {/* Dashboard Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
            {hanaDatasets.map((ds) => (
              <button
                key={ds.dashboardId}
                onClick={() => setSelectedDatasetId(ds.dashboardId)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition ${
                  selectedDatasetId === ds.dashboardId
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {ds.dashboardName.split('&')[0].trim()}
              </button>
            ))}
          </div>

          {/* Selected Dataset Detail Card */}
          {currentDataset && (
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 text-sm">{currentDataset.dashboardName}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-mono font-semibold">
                      Route: {currentDataset.route}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600">{currentDataset.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyDatasetQuery(currentDataset.hanaViewName)}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{copiedQuery ? 'Query Copied!' : 'Copy SQL Query'}</span>
                  </button>
                </div>
              </div>

              {/* View & Table Mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-0.5">
                    SAP HANA Analytical View
                  </span>
                  <code className="text-blue-900 font-mono text-[11px] font-bold block truncate">
                    {currentDataset.hanaViewName}
                  </code>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-0.5">
                    Underlying Column Table
                  </span>
                  <code className="text-neutral-700 font-mono text-[11px] font-semibold block truncate">
                    {currentDataset.primaryTable}
                  </code>
                </div>
              </div>

              {/* Column Schema Definition */}
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <div className="px-3 py-2 bg-neutral-100/80 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500 flex justify-between">
                  <span>View Columns & SAP HANA Data Types</span>
                  <span>{currentDataset.columns.length} Fields</span>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-[10px] uppercase text-neutral-400 border-b border-neutral-100 font-semibold">
                      <tr>
                        <th className="py-1.5 px-3">Column Name</th>
                        <th className="py-1.5 px-3">HANA Type</th>
                        <th className="py-1.5 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-[11px]">
                      {currentDataset.columns.map((col: any) => (
                        <tr key={col.name} className="hover:bg-neutral-50">
                          <td className="py-1.5 px-3 font-mono font-bold text-neutral-900">{col.name}</td>
                          <td className="py-1.5 px-3 font-mono text-blue-800">{col.type}</td>
                          <td className="py-1.5 px-3 text-neutral-600">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Data Table */}
              {currentDataset.sampleData && currentDataset.sampleData.length > 0 && (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="px-3 py-2 bg-neutral-100/80 border-b border-neutral-200 text-[10px] uppercase font-bold text-neutral-500 flex justify-between">
                    <span>Live Dataset Sample (Simulated via In-Memory Aggregations)</span>
                    <span className="text-emerald-700 font-semibold">{currentDataset.sampleData.length} Rows</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-[10px] uppercase text-neutral-400 border-b border-neutral-100 font-semibold">
                        <tr>
                          {Object.keys(currentDataset.sampleData[0]).map((key) => (
                            <th key={key} className="py-1.5 px-3 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 text-[11px]">
                        {currentDataset.sampleData.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            {Object.values(row).map((val: any, vIdx: number) => (
                              <td key={vIdx} className="py-1.5 px-3 font-mono text-neutral-700 whitespace-nowrap">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Data Sync Card & Delivery Formula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agmarknet Ingestion Sync Card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-800" />
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Daily Mandi Ingestion Pipeline</h2>
                <p className="text-[11px] text-neutral-400">Scheduled daily at 16:00 IST</p>
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={syncing}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Ingesting...' : 'Sync Now'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-500">API Key Status:</span>
              <span
                className={`font-semibold ${
                  syncStatus?.hasApiKey ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {syncStatus?.syncStatusLabel || 'Live sync not configured'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-500">Active Source Adapter:</span>
              <span className="font-mono text-neutral-800 font-medium">
                {syncStatus?.sourceAdapter || 'CsvAdapter (Seed Fallback)'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-500">Latest Arrival Date:</span>
              <span className="font-mono font-bold text-neutral-900">
                {syncStatus?.latestArrivalDate}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-neutral-100">
              <span className="text-neutral-500">Total Mandi Records Ingested:</span>
              <span className="font-mono font-bold text-emerald-900">
                {syncStatus?.totalRecords}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-neutral-500">Last Sync Execution:</span>
              <span className="font-mono text-neutral-600">
                {syncStatus?.lastSyncAt
                  ? new Date(syncStatus.lastSyncAt).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Algorithm Settings & Delivery Formula */}
        {settings && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-800" />
                <div>
                  <h2 className="text-sm font-bold text-neutral-900">Matching Weights & Logistics Formula</h2>
                  <p className="text-[11px] text-neutral-400">Controls multi-factor candidate scoring</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-700"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Weights Sliders */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-neutral-600 mb-1">
                  <span>Price Competitiveness Weight:</span>
                  <span className="font-mono font-bold">{settings.weight_price}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.weight_price}
                  onChange={(e) => setSettings({ ...settings, weight_price: Number(e.target.value) })}
                  className="w-full accent-emerald-800"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-600 mb-1">
                  <span>Distance / Proximity Weight:</span>
                  <span className="font-mono font-bold">{settings.weight_distance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.weight_distance}
                  onChange={(e) =>
                    setSettings({ ...settings, weight_distance: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-800"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-600 mb-1">
                  <span>Quantity Fit Weight:</span>
                  <span className="font-mono font-bold">{settings.weight_quantity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={settings.weight_quantity}
                  onChange={(e) =>
                    setSettings({ ...settings, weight_quantity: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Delivery Base Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.delivery_base_fee}
                    onChange={(e) =>
                      setSettings({ ...settings, delivery_base_fee: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Per-km-per-tonne Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.delivery_per_km_tonne}
                    onChange={(e) =>
                      setSettings({ ...settings, delivery_per_km_tonne: Number(e.target.value) })
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Supabase PostgreSQL Cloud Database Integration */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-900">Supabase PostgreSQL Cloud Database</h2>
                {supabaseInfo?.config?.isConfigured ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Awaiting Secrets (Local Fallback Active)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                Connected via server environment variables <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[10px]">SUPABASE_URL</code> and <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[10px]">SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleViewSchema}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-neutral-500" />
              <span>View Schema SQL</span>
            </button>

            <button
              onClick={handleSyncSupabase}
              disabled={syncingSupabase || !supabaseInfo?.config?.isConfigured}
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
              <span>{syncingSupabase ? 'Synchronizing...' : 'Sync to Supabase'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-neutral-500 text-[11px] block">Supabase Project URL:</span>
            <div className="font-mono text-[11px] text-neutral-800 font-medium truncate">
              {supabaseInfo?.config?.supabaseUrl || (
                <span className="text-neutral-400 italic">Not set (Enter in Secrets panel)</span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400">Read from env variable SUPABASE_URL</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-neutral-500 text-[11px] block">Anon Public Key Status:</span>
            <div className="font-mono text-[11px] text-neutral-800 font-medium">
              {supabaseInfo?.config?.hasAnonKey ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  Loaded ({supabaseInfo?.config?.anonKeyPreview})
                </span>
              ) : (
                <span className="text-neutral-400 italic">Not set (Enter in Secrets panel)</span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400">Read from env variable SUPABASE_ANON_KEY</span>
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-1">
            <span className="text-neutral-500 text-[11px] block">Live Connection Status:</span>
            <div className="font-medium text-[11px]">
              {supabaseInfo?.connection?.connected ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Healthy & Responsive
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {supabaseInfo?.connection?.message || 'Awaiting secrets configuration'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400">
              {supabaseInfo?.syncStatus?.lastSuccessAt
                ? `Last sync: ${new Date(supabaseInfo.syncStatus.lastSuccessAt).toLocaleTimeString()}`
                : 'Zero secrets hardcoded'}
            </span>
          </div>
        </div>
      </div>

      {/* SAP HANA SQL Schema Modal */}
      {showHanaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-blue-900 text-white">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    SAP HANA Cloud DDL Schema — Schema "{hanaInfo?.config?.schema || '07083DD5224243A8B73B330781FE33B6'}"
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Column-store tables & analytical views ready for SAP HANA Cloud Database Explorer or hana-mcp-server
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHanaSql}
                  className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedHanaSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={() => setShowHanaModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-blue-800 text-white flex items-center justify-center font-bold text-sm"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-neutral-950 font-mono text-[11px] text-cyan-300 leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{hanaSchemaSql}</pre>
            </div>

            <div className="p-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
              <span>Includes 12 Column Tables, 13 Analytical Views & Seed Profiles</span>
              <button
                onClick={() => setShowHanaModal(false)}
                className="px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Supabase PostgreSQL Schema (DDL)</h3>
                  <p className="text-[11px] text-neutral-500">Run this in your Supabase SQL Editor to initialize all tables and policies</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={() => setShowSchemaModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-neutral-900 font-mono text-[11px] text-emerald-400 leading-relaxed select-all">
              <pre className="whitespace-pre-wrap">{schemaSql}</pre>
            </div>

            <div className="p-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
              <span>Includes tables: agro_prices, profiles, farmer_listings, customer_requirements, deal_proposals, orders, notifications, price_alerts</span>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-800" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              User Role Management & Permissions
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400">Total Users: {users.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-3">Email / Phone</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-semibold text-neutral-900">{u.name}</td>
                  <td className="py-3 px-3 text-neutral-600 font-mono text-[11px]">{u.email || u.phone}</td>
                  <td className="py-3 px-3 text-neutral-600">
                    {u.district}, {u.state}
                  </td>
                  <td className="py-3 px-3 font-semibold capitalize text-emerald-900">{u.role}</td>
                  <td className="py-3 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-xs"
                    >
                      <option value="farmer">Farmer</option>
                      <option value="customer">Customer</option>
                      <option value="trader">Trader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
