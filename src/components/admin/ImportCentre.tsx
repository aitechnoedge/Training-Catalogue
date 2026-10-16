import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import {
  commitCourseImport,
  getImportHistory,
  ImportPreview,
  jsonlDownloadUrl,
  previewCourseImport,
} from '../../api/importApi';

export const ImportCentre: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; message: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState<Array<{ preview_id: string; file_name: string; status: string; created_at: string; completed_at?: string; counts?: { valid?: number } }>>([]);
  const loadHistory = () => getImportHistory().then((response) => setHistory(response.data)).catch(() => setError('Import history could not be loaded. You can still validate a new file.'));

  useEffect(() => { loadHistory(); }, []);

  const validate = async () => {
    setError(null);
    setResult(null);
    setConfirmed(false);
    if (!selectedFile && !pastedText.trim()) {
      setError('Choose a file or paste course data first.');
      return;
    }
    setIsWorking(true);
    try {
      const source = selectedFile || new Blob([pastedText], { type: 'text/plain' });
      const fileName = selectedFile?.name || 'pasted-course-data.txt';
      setPreview(await previewCourseImport(source, fileName));
    } catch (validationError) {
      setPreview(null);
      setError(validationError instanceof Error ? validationError.message : 'Validation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const importCourses = async () => {
    if (!preview || !confirmed) return;
    setIsWorking(true);
    setError(null);
    try {
      setResult(await commitCourseImport(preview.previewId));
      setConfirmed(false);
      loadHistory();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8" aria-labelledby="import-centre-title" aria-busy={isWorking}>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#01266A]">Secure catalogue administration</p>
        <h1 id="import-centre-title" className="text-3xl font-bold text-black">Course Import Centre</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-black/65">
          Upload a Tools or Role-Based Excel, JSON, JSONL, or structured course-text file. Validation happens before Supabase is changed.
          Rejected records are skipped and listed below.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[rgba(38,102,196,0.14)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#01266A]" />
            <h2 className="text-lg font-bold">1. Add course data</h2>
          </div>
          <label className="block text-sm font-semibold" htmlFor="course-import-file">Upload a file</label>
          <input
            id="course-import-file"
            type="file"
            accept=".xlsx,.json,.jsonl,.ndjson,.txt"
            className="mt-2 block w-full rounded-lg border border-[rgba(38,102,196,0.14)] px-3 py-3 text-sm"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0] || null);
              if (event.target.files?.[0]) setPastedText('');
              setPreview(null);
            }}
          />
          <p className="my-4 text-center text-xs font-semibold uppercase tracking-wider text-black/40">or paste JSON / JSONL / structured text</p>
          <textarea
            id="course-import-paste"
            value={pastedText}
            onChange={(event) => {
              setPastedText(event.target.value);
              if (event.target.value) setSelectedFile(null);
              setPreview(null);
            }}
            rows={10}
            placeholder="Paste one or more course records here"
            className="w-full rounded-lg border border-[rgba(38,102,196,0.14)] p-3 font-mono text-xs focus:border-[#01266A] focus:outline-none focus:ring-2 focus:ring-[#73C2FB]/30"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={validate}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-lg bg-[#01266A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {isWorking ? 'Working…' : 'Validate and preview'}
            </button>
            <a
              href="/api/adminzz/catalogue/import/template"
              download
              className="inline-flex items-center gap-2 rounded-lg border border-[rgba(38,102,196,0.24)] px-5 py-3 text-sm font-semibold text-[#01266A]"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Download Excel template
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(38,102,196,0.14)] bg-[#F0F7FF]/40 p-5">
          <h2 className="mb-4 text-lg font-bold">2. Review and import</h2>
          {!preview && !result && <p className="text-sm text-black/55">Validation results will appear here.</p>}
          {preview && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Records', preview.counts.records],
                  ['Valid', preview.counts.valid],
                  ['Rejected', preview.counts.rejected],
                  ['Warnings', preview.counts.warnings],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[rgba(38,102,196,0.14)] bg-white p-3">
                    <div className="text-xl font-bold">{value}</div>
                    <div className="text-xs text-black/55">{label}</div>
                  </div>
                ))}
              </div>
              <a
                href={jsonlDownloadUrl(preview.previewId)}
                download
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#01266A] underline"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download converted JSONL
              </a>
              {preview.canImport && (
                <div className="mt-5 border-t border-[rgba(38,102,196,0.14)] pt-5">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                      className="mt-1"
                    />
                    <span>I reviewed the report. Import {preview.counts.valid} valid records and skip {preview.counts.rejected} rejected records.</span>
                  </label>
                  <button
                    type="button"
                    disabled={!confirmed || isWorking}
                    onClick={importCourses}
                    className="mt-4 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isWorking ? 'Importing…' : `Import ${preview.counts.valid} courses to Supabase`}
                  </button>
                </div>
              )}
            </>
          )}
          {result && (
            <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <div><strong>{result.imported} courses imported.</strong><div className="mt-1">{result.message || 'The catalogue now reads them directly from Supabase.'}</div></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {preview && preview.issues.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-[rgba(38,102,196,0.14)] bg-white">
          <div className="border-b border-[rgba(38,102,196,0.14)] px-5 py-4">
            <h2 className="text-lg font-bold">Validation report</h2>
            <p className="mt-1 text-xs text-black/55">Errors reject a record. Warnings show automatic corrections or updates.</p>
          </div>
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-[#F0F7FF] text-xs uppercase text-black/55">
                <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Field</th><th className="px-4 py-3">Message</th></tr>
              </thead>
              <tbody className="divide-y divide-[rgba(38,102,196,0.10)]">
                {preview.issues.map((item, index) => (
                  <tr key={`${item.code}-${item.courseId}-${index}`}>
                    <td className={`px-4 py-3 font-semibold ${item.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>{item.severity}</td>
                    <td className="px-4 py-3 font-mono">{item.courseId || `Row ${item.sourceRow || '?'}`}</td>
                    <td className="px-4 py-3">{item.field}</td>
                    <td className="px-4 py-3 text-black/70">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && preview.sample.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Sample of valid records</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {preview.sample.map((course) => (
              <div key={course.courseId} className="rounded-lg border border-[rgba(38,102,196,0.14)] bg-white p-4 text-sm">
                <div className="font-mono text-xs font-semibold text-[#01266A]">{course.courseId}</div>
                <div className="mt-1 font-bold">{course.title}</div>
                <div className="mt-2 text-xs text-black/55">{course.department || course.toolName || course.category} · {course.level} · {course.durationMinutes / 60} hours · {course.modules} modules · {course.scenarios} scenarios</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-[rgba(38,102,196,0.14)] bg-white p-5" aria-labelledby="import-history-title">
        <h2 id="import-history-title" className="text-lg font-bold">Import history</h2>
        {history.length ? <ul className="mt-3 divide-y divide-[rgba(38,102,196,0.12)] text-sm">{history.map((batch) => (
          <li key={batch.preview_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span><strong>{batch.file_name}</strong><span className="ml-2 text-black/50">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(batch.created_at))} IST</span></span>
            <span className="rounded-full bg-[#F0F7FF] px-2 py-1 text-xs font-bold text-[#01266A]">{batch.status} · {batch.counts?.valid || 0} valid</span>
          </li>
        ))}</ul> : <p className="mt-3 text-sm text-black/55">Validated and imported batches will be recorded here.</p>}
      </section>
    </section>
  );
};
