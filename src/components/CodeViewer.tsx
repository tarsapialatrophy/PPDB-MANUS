import { useState } from "react";
import { Copy, Check, Download, FileCode, CheckCircle2 } from "lucide-react";
import { phpProjectFiles, SourceFile } from "../data/phpCode";

export default function CodeViewer() {
  const [selectedFile, setSelectedFile] = useState<SourceFile>(phpProjectFiles[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      alert("Gagal menyalin otomatis, silakan salin teks secara manual.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
      
      {/* Sidebar List Files (Kiri) */}
      <div className="lg:col-span-4 border-r border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="px-2 py-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Berkas Proyek PHP Native
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pilihlah file untuk meninjau kodenya
          </p>
        </div>
        
        <div className="space-y-1">
          {phpProjectFiles.map((file) => {
            const isSelected = file.name === selectedFile.name;
            return (
              <button
                key={file.name}
                id={`btn-code-file-${file.name.replace(".", "-")}`}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10 font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <FileCode className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <div className="overflow-hidden">
                  <span className="block text-xs font-mono">{file.name}</span>
                  <span
                    className={`block text-[10px] truncate ${
                      isSelected ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    /{file.path}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-blue-500/5 dark:bg-blue-400/5 rounded-xl border border-blue-500/10 dark:border-blue-400/10 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Prepared Statements
          </div>
          Kode dijamin aman dari celah serangan siber <span className="font-mono text-[11px]">SQL Injection</span> melalui parameter biding kueri terpisah.
        </div>
      </div>

      {/* Editor Viewer (Kanan) */}
      <div className="lg:col-span-8 flex flex-col min-h-[480px]">
        {/* Header Editor */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/20 dark:bg-slate-900/40 flex flex-wrap gap-3 items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {selectedFile.name}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                {selectedFile.language}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedFile.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 border ${
                copied
                  ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/50"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Disalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode
                </>
              )}
            </button>
            <button
              id="btn-download-code"
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors duration-150"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh File
            </button>
          </div>
        </div>

        {/* Kode Display */}
        <div className="relative flex-1 bg-[#1e293b] p-4 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed select-all text-slate-100">
          <pre className="whitespace-pre overflow-x-auto">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
