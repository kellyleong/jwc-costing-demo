import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  CaretDown,
  CaretRight,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  Copy,
  CurrencyCircleDollar,
  Database,
  DownloadSimple,
  Eye,
  FileArrowDown,
  FileText,
  FileXls,
  Funnel,
  GearSix,
  Info,
  LockKey,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  SpinnerGap,
  Tag,
  Trash,
  Truck,
  UploadSimple,
  UserCircle,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  ADMIN_ACCOUNTS,
  ANONYMOUS_FEEDBACK,
  DATASETS,
  INITIAL_SELECTION,
  PRICE_RECORDS,
  THRESHOLD_DEMO_SELECTION,
} from "./data.js";
import {
  formatMop,
  groupSelectedRecords,
  rankSearchRecords,
  searchRecord,
} from "./domain.js";

const ADMIN_SECTIONS = [
  { route: "/admin/imports", label: "匯入批次", icon: UploadSimple },
  { route: "/admin/canonical", label: "標準名稱／別名", icon: Tag },
  { route: "/admin/fx", label: "現行匯率", icon: CurrencyCircleDollar },
  { route: "/admin/accounts", label: "帳戶及重設", icon: UsersThree },
  { route: "/admin/feedback", label: "匿名回饋", icon: Info },
  { route: "/admin/audit", label: "Audit／Rollback", icon: ClockCounterClockwise },
];

const STATUS_COPY = {
  UPLOAD: "UPLOAD",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  READY_TO_PUBLISH: "READY_TO_PUBLISH",
  PUBLISHED: "PUBLISHED",
  ROLLED_BACK: "ROLLED_BACK",
};

const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function currentRoute() {
  const path = APP_BASE && window.location.pathname.startsWith(APP_BASE)
    ? window.location.pathname.slice(APP_BASE.length) || "/"
    : window.location.pathname;
  return path === "/" ? "/search/subcontractors" : path;
}

function datasetFromRoute(route) {
  if (route.includes("suppliers")) return "suppliers";
  if (route.includes("historical")) return "historical";
  return "subcontractors";
}

function datasetLabel(code) {
  return Object.values(DATASETS).find((dataset) => dataset.code === code)?.label ?? code;
}

function useAppRoute() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const onPopState = () => setRoute(currentRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextRoute) => {
    window.history.pushState({}, "", `${APP_BASE}${nextRoute}`);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return [route, navigate];
}

function IconButton({ label, children, onClick, className = "", disabled = false, buttonRef = null }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      ref={buttonRef}
    >
      {children}
    </button>
  );
}

function BrandMark() {
  return (
    <div className="brand-lockup" aria-label="Joint Win JWC Costing">
      <span className="brand-mark" aria-hidden="true">JW</span>
      <span>
        <strong>JOINT WIN</strong>
        <small>JWC COSTING</small>
      </span>
    </div>
  );
}

function Sidebar({ route, navigate, account }) {
  const isAdmin = route.startsWith("/admin");
  return (
    <aside className="sidebar">
      <BrandMark />
      <nav className="sidebar-nav" aria-label="主要導覽">
        {!isAdmin && (
          <>
            <p className="nav-kicker">搜尋資料集</p>
            {Object.values(DATASETS).map((dataset) => {
              const Icon = dataset.code === "S1" ? FileText : dataset.code === "S2" ? Truck : ClockCounterClockwise;
              return (
                <button
                  type="button"
                  key={dataset.code}
                  className={route === dataset.route ? "nav-item active" : "nav-item"}
                  onClick={() => navigate(dataset.route)}
                >
                  <Icon size={21} weight={route === dataset.route ? "fill" : "regular"} />
                  <span>{dataset.label}</span>
                  <small>{dataset.code}</small>
                </button>
              );
            })}
            <button
              type="button"
              className={route === "/compare" ? "nav-item active" : "nav-item"}
              onClick={() => navigate("/compare")}
            >
              <SlidersHorizontal size={21} />
              <span>分組比較</span>
              <small>ALL</small>
            </button>
          </>
        )}
        {isAdmin && (
          <>
            <p className="nav-kicker">管理後台</p>
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  type="button"
                  key={section.route}
                  className={route === section.route ? "nav-item active" : "nav-item"}
                  onClick={() => navigate(section.route)}
                >
                  <Icon size={21} weight={route === section.route ? "fill" : "regular"} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {!isAdmin && (
          <button type="button" className="nav-item compact" onClick={() => navigate("/login?role=admin") }>
            <GearSix size={20} />
            <span>管理員登入</span>
          </button>
        )}
        {isAdmin && (
          <button type="button" className="nav-item compact" onClick={() => navigate("/search/subcontractors") }>
            <ArrowLeft size={20} />
            <span>返回搜尋</span>
          </button>
        )}
        <div className="session-identity">
          <UserCircle size={22} />
          <span>
            <b>{account?.username ?? "訪客"}</b>
            <small>{account?.role === "ADMIN" ? "DATABASE ADMIN" : "SEARCH USER"}</small>
          </span>
        </div>
        <p className="build-stamp">v001 · 2026-08-01</p>
      </div>
    </aside>
  );
}

function Topbar({ account, qwenDegraded, onToggleQwen, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <span className="environment-dot" />
        <span>內網 Prototype</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className={qwenDegraded ? "service-status degraded" : "service-status"}
          onClick={onToggleQwen}
          aria-pressed={qwenDegraded}
        >
          {qwenDegraded ? <WarningCircle size={16} weight="fill" /> : <CheckCircle size={16} weight="fill" />}
          {qwenDegraded ? "Qwen 已降級" : "Qwen 正常"}
        </button>
        <span className="account-pill">
          <UserCircle size={18} />
          {account?.username}
        </span>
        <IconButton label="登出示範" onClick={onLogout}>
          <SignOut size={19} />
        </IconButton>
      </div>
    </header>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle size={20} weight="fill" />
      <span>{message}</span>
      <IconButton label="關閉通知" onClick={onClose}>
        <X size={16} />
      </IconButton>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const roleFromQuery = new URLSearchParams(window.location.search).get("role");
  const [role, setRole] = useState(roleFromQuery === "admin" ? "ADMIN" : "SEARCH_USER");
  const [username, setUsername] = useState(role === "ADMIN" ? "data-admin" : "user1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("示範密碼請輸入至少 8 個字元；不會被保存。 ");
      return;
    }
    onLogin({ username: username.trim() || (role === "ADMIN" ? "data-admin" : "user1"), role });
  };

  const changeRole = (nextRole) => {
    setRole(nextRole);
    setUsername(nextRole === "ADMIN" ? "data-admin" : "user1");
    setPassword("");
    setError("");
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <BrandMark />
        <div className="login-statement">
          <span>SEARCH FOUNDATION · F0 + S1–S3</span>
          <h1>每一筆正式價格，都可搜尋、比較及追溯。</h1>
          <p>資料在入庫前由員工完成標準化；系統只發布具備工項、單位、價格語義、scope、basis及來源證據的完整記錄。</p>
        </div>
        <div className="login-principle">
          <ShieldCheck size={24} weight="fill" />
          <span>
            <b>分組比較，不混算</b>
            <small>不同語義、單位或範圍仍可同時選取，但只在相同分析組內統計。</small>
          </span>
        </div>
      </section>
      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>
          <span className="eyebrow">JWC COSTING SEARCH</span>
          <h2>登入示範</h2>
          <p>選擇角色以檢視搜尋殼或受權限保護的管理後台。</p>
          <div className="role-switch" aria-label="登入角色">
            <button type="button" className={role === "SEARCH_USER" ? "active" : ""} onClick={() => changeRole("SEARCH_USER")}>Search User</button>
            <button type="button" className={role === "ADMIN" ? "active" : ""} onClick={() => changeRole("ADMIN")}>Database Admin</button>
          </div>
          <label>
            <span>帳戶</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            <span>密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="示範：輸入任意 8 個字元"
              aria-describedby="password-note"
            />
          </label>
          <small id="password-note">Prototype 不保存或輸出密碼；正式系統只保存 Argon2id hash。</small>
          {error && <div className="form-error" role="alert"><WarningCircle size={18} />{error}</div>}
          <button type="submit" className="button primary wide">
            {role === "ADMIN" ? "登入管理後台" : "登入搜尋系統"}
            <ArrowRight size={19} />
          </button>
          <div className="login-security-note">
            <LockKey size={17} />
            <span>沒有公開註冊、個人改密碼或 forgot-password。</span>
          </div>
        </form>
      </section>
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="filter-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        <option value="">{label}（全部）</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <CaretDown size={15} aria-hidden="true" />
    </label>
  );
}

function SearchHeader({
  dataset,
  query,
  setQuery,
  mode,
  setMode,
  filters,
  setFilter,
  resetFilters,
  onSearch,
  sort,
  setSort,
  qwenDegraded,
}) {
  const units = [...new Set(PRICE_RECORDS.filter((record) => record.dataset === dataset.code).map((record) => record.standardUnit))];
  const quoteTypes = [...new Set(PRICE_RECORDS.filter((record) => record.dataset === dataset.code).map((record) => record.standardQuoteType))];
  const semantics = [...new Set(PRICE_RECORDS.filter((record) => record.dataset === dataset.code).map((record) => record.priceSemanticLabel))];
  const scopes = [...new Set(PRICE_RECORDS.filter((record) => record.dataset === dataset.code).map((record) => record.scopeLabel))];
  return (
    <section className="search-header">
      <div className="title-row">
        <div>
          <span className="eyebrow">{dataset.code} · {dataset.description}</span>
          <h1>JWC Costing Search</h1>
        </div>
        <span className="published-badge"><Check size={15} weight="bold" /> 只顯示已發布正式記錄</span>
      </div>
      {qwenDegraded && (
        <div className="degraded-banner" role="status">
          <WarningCircle size={20} weight="fill" />
          <span><b>Qwen query expansion 暫停。</b> exact、canonical、approved alias及結構化篩選仍正常。</span>
        </div>
      )}
      <div className="search-command-row">
        <label className="search-box">
          <MagnifyingGlass size={23} />
          <span className="sr-only">搜尋價格資料</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onSearch()}
            placeholder="搜尋原文、標準工項、別名、中英文或工項代碼"
          />
          {query && (
            <IconButton label="清除搜尋" onClick={() => setQuery("")}>
              <X size={18} />
            </IconButton>
          )}
        </label>
        <button type="button" className="button primary search-button" onClick={onSearch}>
          <MagnifyingGlass size={18} /> 搜尋
        </button>
        {dataset.code === "S1" && (
          <div className="mode-switch" aria-label="判頭搜尋顯示方式">
            <button type="button" className={mode === "detail" ? "active" : ""} onClick={() => setMode("detail")}>報價明細</button>
            <button type="button" className={mode === "contractor" ? "active" : ""} onClick={() => setMode("contractor")}>判頭分類</button>
          </div>
        )}
      </div>
      <div className="filter-row">
        <FilterSelect label="單位" value={filters.unit} onChange={(value) => setFilter("unit", value)} options={units} />
        <FilterSelect label="報價類型" value={filters.quoteType} onChange={(value) => setFilter("quoteType", value)} options={quoteTypes} />
        <FilterSelect label="價格語義" value={filters.semantic} onChange={(value) => setFilter("semantic", value)} options={semantics} />
        <FilterSelect label="詳細內容" value={filters.scope} onChange={(value) => setFilter("scope", value)} options={scopes} />
        <FilterSelect label="運輸包含" value={filters.transport} onChange={(value) => setFilter("transport", value)} options={["不包含", "已包含", "獨立運輸行", "不適用"]} />
        <FilterSelect label="曾選用" value={filters.used} onChange={(value) => setFilter("used", value)} options={["是", "否"]} />
        <button type="button" className="button ghost small" onClick={resetFilters}><ArrowsClockwise size={16} />重設</button>
        <label className="sort-control">
          <span>排序</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="relevance">相關度</option>
            <option value="priceAsc">價格：低至高</option>
            <option value="priceDesc">價格：高至低</option>
            <option value="dateDesc">日期：新至舊</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function LoadingRows() {
  return (
    <div className="loading-state" role="status">
      <SpinnerGap size={28} className="spin" />
      <b>正在搜尋正式價格記錄</b>
      <span>套用 canonical、approved alias及結構化條件。</span>
      <div className="loading-lines" aria-hidden="true"><i /><i /><i /></div>
    </div>
  );
}

function EmptyState({ reset }) {
  return (
    <div className="empty-state">
      <MagnifyingGlass size={34} />
      <h2>找不到符合全部條件的正式記錄</h2>
      <p>系統不會顯示缺少canonical item、單位、MOP值、scope、basis或來源證據的資料。</p>
      <button type="button" className="button secondary" onClick={reset}>清除篩選並重試</button>
    </div>
  );
}

function SemanticPill({ children, tone = "blue" }) {
  return <span className={`semantic-pill ${tone}`}>{children}</span>;
}

function ResultTable({ records, selectedIds, onToggleSelected, onOpenEvidence }) {
  return (
    <div className="result-table-wrap">
      <table className="result-table">
        <thead>
          <tr>
            <th className="check-col"><span className="sr-only">選取</span></th>
            <th>原始描述</th>
            <th>標準描述</th>
            <th>判頭／項目</th>
            <th>單位</th>
            <th className="numeric">MOP 單價</th>
            <th>價格語義</th>
            <th>運輸</th>
            <th>曾選用</th>
            <th>來源</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const selected = selectedIds.includes(record.id);
            return (
              <tr key={record.id} className={selected ? "selected" : ""}>
                <td className="check-col">
                  <label className="record-checkbox">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelected(record.id)}
                      aria-label={`把 ${record.id} ${selected ? "移出" : "加入"}比較`}
                    />
                    <span aria-hidden="true">{selected && <Check size={14} weight="bold" />}</span>
                  </label>
                  <small>{index + 1}</small>
                </td>
                <td>
                  <b>{record.rawDescription}</b>
                  <small>{record.id}</small>
                  <button type="button" className="mobile-evidence-link" onClick={() => onOpenEvidence(record)}>查看來源證據</button>
                </td>
                <td><b>{record.canonicalDescription}</b><small>{record.itemCode} · {record.scopeLabel}</small></td>
                <td><b>{record.counterparty}</b><small>{record.project}</small></td>
                <td>{record.standardUnit}</td>
                <td className="numeric price-cell">{formatMop(record.mopValue)}</td>
                <td><SemanticPill>{record.priceSemanticLabel}</SemanticPill><small>{record.standardQuoteType}</small></td>
                <td>{record.transportLabel}</td>
                <td>{record.used ? <SemanticPill tone="green">是</SemanticPill> : <span className="muted">否</span>}</td>
                <td>
                  <button type="button" className="source-link" onClick={() => onOpenEvidence(record)}>
                    {record.sourceDocument}<CaretRight size={16} />
                  </button>
                  <small>{record.sourceLocator}</small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ContractorGroups({ records, selectedIds, onToggleSelected, onOpenEvidence }) {
  const groups = useMemo(() => {
    const map = new Map();
    records.forEach((record) => {
      if (!map.has(record.counterparty)) map.set(record.counterparty, []);
      map.get(record.counterparty).push(record);
    });
    return [...map.entries()];
  }, [records]);

  return (
    <div className="contractor-grid">
      {groups.map(([counterparty, groupRecords]) => (
        <article className="contractor-card" key={counterparty}>
          <header>
            <div><span className="eyebrow">判頭分類</span><h3>{counterparty}</h3></div>
            <SemanticPill>{groupRecords.length} 筆</SemanticPill>
          </header>
          <dl>
            <div><dt>工項覆蓋</dt><dd>{[...new Set(groupRecords.map((record) => record.itemCode))].join("、")}</dd></div>
            <div><dt>報價類型</dt><dd>{[...new Set(groupRecords.map((record) => record.standardQuoteType))].join("、")}</dd></div>
            <div><dt>可比較範圍</dt><dd>{[...new Set(groupRecords.map((record) => record.scopeLabel))].join("；")}</dd></div>
          </dl>
          <div className="contractor-records">
            {groupRecords.map((record) => (
              <div key={record.id}>
                <label className="record-checkbox">
                  <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => onToggleSelected(record.id)} />
                  <span aria-hidden="true">{selectedIds.includes(record.id) && <Check size={14} weight="bold" />}</span>
                </label>
                <span><b>MOP {formatMop(record.mopValue)} / {record.standardUnit}</b><small>{record.standardQuoteType} · {record.priceSemanticLabel}</small></span>
                <button type="button" className="source-link" onClick={() => onOpenEvidence(record)}>證據<CaretRight size={15} /></button>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function EvidenceDrawer({ record, onClose, notify }) {
  const closeButton = useRef(null);
  useEffect(() => {
    if (record && document.activeElement instanceof HTMLButtonElement) closeButton.current?.focus();
  }, [record]);
  if (!record) return null;

  const downloadManifest = () => {
    const manifest = [
      "JWC CONTROLLED SOURCE EVIDENCE — PROTOTYPE",
      `Record: ${record.id}`,
      `Document: ${record.sourceDocument}`,
      `Locator: ${record.sourceLocator}`,
      `SHA-256: ${record.sourceHash}`,
      `Raw value: ${record.originalValue} ${record.originalCurrency}`,
      `Exchange rate used: ${record.exchangeRateUsed}`,
      `MOP value: ${formatMop(record.mopValue)}`,
      `Confirmation: ${record.confirmationEvidence}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([manifest], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `evidence_${record.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("已下載受控來源證據模擬檔；沒有本機絕對路徑。 ");
  };

  return (
    <aside className="evidence-drawer" aria-label="來源證據" aria-live="polite">
      <header>
        <div><span className="eyebrow">SOURCE EVIDENCE</span><h2>來源證據</h2></div>
        <IconButton label="關閉來源證據" onClick={onClose} buttonRef={closeButton}>
          <X size={21} />
        </IconButton>
      </header>
      <div className="evidence-record-id"><FileText size={19} /><b>{record.id}</b></div>
      <dl className="evidence-list">
        <div><dt>來源文件</dt><dd>{record.sourceDocument}</dd></div>
        <div><dt>頁／Sheet／Row</dt><dd>{record.sourceLocator}</dd></div>
        <div><dt>SHA-256</dt><dd title={record.sourceHash}>{record.sourceHash.slice(0, 12)}…{record.sourceHash.slice(-8)}</dd></div>
        <div><dt>原始幣別／值</dt><dd>{record.originalCurrency} {formatMop(record.originalValue)}</dd></div>
        <div><dt>採用匯率</dt><dd>{Number(record.exchangeRateUsed).toFixed(4)} MOP/{record.originalCurrency}</dd></div>
        <div><dt>供應商數量</dt><dd>{record.supplierQuoteQty} {record.standardUnit}</dd></div>
        <div><dt>Project數量</dt><dd>{record.clientProjectQty} {record.standardUnit}</dd></div>
        <div><dt>數量關係</dt><dd>{record.qtyRelationship}</dd></div>
        <div className="evidence-emphasis"><dt>MOP比較值</dt><dd>MOP {formatMop(record.mopValue)} / {record.standardUnit}</dd></div>
        <div><dt>價格語義</dt><dd>{record.priceSemanticLabel}</dd></div>
        <div><dt>計算基準</dt><dd>{record.unitCostBasisLabel}</dd></div>
        <div><dt>Scope</dt><dd>{record.scopeLabel}</dd></div>
        <div><dt>曾選用證據</dt><dd>{record.used ? record.confirmationEvidence : "v004 item-level 確認：否"}</dd></div>
      </dl>
      <button type="button" className="button secondary wide" onClick={downloadManifest}><DownloadSimple size={18} />下載受控來源模擬</button>
      <div className="feedback-box">
        <span>這項結果與搜尋相關嗎？</span>
        <div>
          <button type="button" onClick={() => notify("已記錄匿名「有用」回饋；不保存帳戶、IP或搜尋歷史。 ")}>有用</button>
          <button type="button" onClick={() => notify("已記錄匿名「不相關」回饋；達三次門檻才進管理清單。 ")}>不相關</button>
        </div>
      </div>
    </aside>
  );
}

function ComparisonBar({ selectedRecords, groups, navigate, clearSelection }) {
  if (!selectedRecords.length) return null;
  return (
    <div className="comparison-bar">
      <div className="comparison-count">
        <span className="checked-square"><Check size={16} weight="bold" /></span>
        <span><b>已選 {selectedRecords.length} 筆</b><button type="button" onClick={clearSelection}>清除選擇</button></span>
      </div>
      <div className="comparison-count group-count">
        <span><b>{groups.length} 分析組</b><small>不相容條件已自動分組</small></span>
      </div>
      <button type="button" className="button primary comparison-cta" onClick={() => navigate("/compare")}>開啟分組分析<ArrowRight size={20} /></button>
    </div>
  );
}

function SearchPage({
  route,
  navigate,
  account,
  qwenDegraded,
  toggleQwen,
  logout,
  selectedIds,
  setSelectedIds,
  notify,
}) {
  const datasetKey = datasetFromRoute(route);
  const dataset = DATASETS[datasetKey];
  const [query, setQuery] = useState("AL01 鋁質方形扣板天花");
  const [mode, setMode] = useState("detail");
  const [sort, setSort] = useState("relevance");
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState(() => window.innerWidth > 900
    ? PRICE_RECORDS.find((record) => record.id === "S1-CA-AL01-001")
    : null);
  const [filters, setFilters] = useState({ unit: "", quoteType: "", semantic: "", scope: "", transport: "", used: "" });
  const previousDataset = useRef(dataset.code);

  useEffect(() => {
    if (previousDataset.current !== dataset.code) {
      setEvidence(null);
      if (dataset.code !== "S1") setMode("detail");
      previousDataset.current = dataset.code;
    }
  }, [dataset.code]);

  const results = useMemo(() => {
    let next = rankSearchRecords(
      PRICE_RECORDS.filter((record) => record.dataset === dataset.code),
      query,
      { degraded: qwenDegraded },
    ).map(({ record }) => record);
    if (filters.unit) next = next.filter((record) => record.standardUnit === filters.unit);
    if (filters.quoteType) next = next.filter((record) => record.standardQuoteType === filters.quoteType);
    if (filters.semantic) next = next.filter((record) => record.priceSemanticLabel === filters.semantic);
    if (filters.scope) next = next.filter((record) => record.scopeLabel === filters.scope);
    if (filters.transport) next = next.filter((record) => record.transportLabel === filters.transport);
    if (filters.used) next = next.filter((record) => record.used === (filters.used === "是"));
    if (sort === "priceAsc") next = [...next].sort((a, b) => a.mopValue - b.mopValue);
    if (sort === "priceDesc") next = [...next].sort((a, b) => b.mopValue - a.mopValue);
    if (sort === "dateDesc") next = [...next].sort((a, b) => b.date.localeCompare(a.date));
    return next;
  }, [dataset.code, filters, query, qwenDegraded, sort]);

  const selectedRecords = PRICE_RECORDS.filter((record) => selectedIds.includes(record.id));
  const groups = groupSelectedRecords(selectedRecords);
  const toggleSelected = (recordId) => {
    setSelectedIds((current) => current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId]);
  };
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const reset = () => {
    setFilters({ unit: "", quoteType: "", semantic: "", scope: "", transport: "", used: "" });
    setQuery("AL01 鋁質方形扣板天花");
  };
  const runSearch = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 650);
  };

  return (
    <div className="app-frame">
      <Sidebar route={route} navigate={navigate} account={account} />
      <div className="app-main">
        <Topbar account={account} qwenDegraded={qwenDegraded} onToggleQwen={toggleQwen} onLogout={logout} />
        <SearchHeader
          dataset={dataset}
          query={query}
          setQuery={setQuery}
          mode={mode}
          setMode={setMode}
          filters={filters}
          setFilter={setFilter}
          resetFilters={reset}
          onSearch={runSearch}
          sort={sort}
          setSort={setSort}
          qwenDegraded={qwenDegraded}
        />
        <div className={evidence ? "search-workspace with-evidence" : "search-workspace"}>
          <section className="results-panel" aria-busy={loading}>
            <header className="results-toolbar">
              <div><b>{loading ? "搜尋中" : `${results.length} 筆正式記錄`}</b><span>所有結果都可加入比較及輸出</span></div>
              <span className="data-boundary"><Database size={16} />production business tables</span>
            </header>
            {loading ? <LoadingRows /> : results.length === 0 ? <EmptyState reset={reset} /> : mode === "contractor" ? (
              <ContractorGroups records={results} selectedIds={selectedIds} onToggleSelected={toggleSelected} onOpenEvidence={setEvidence} />
            ) : (
              <ResultTable records={results} selectedIds={selectedIds} onToggleSelected={toggleSelected} onOpenEvidence={setEvidence} />
            )}
          </section>
          <EvidenceDrawer record={evidence} onClose={() => setEvidence(null)} notify={notify} />
        </div>
        <ComparisonBar selectedRecords={selectedRecords} groups={groups} navigate={navigate} clearSelection={() => setSelectedIds([])} />
      </div>
    </div>
  );
}

function StatCell({ label, value, muted = false }) {
  return <div className={muted ? "stat-cell muted" : "stat-cell"}><span>{label}</span><b>{value === null ? "–" : formatMop(value)}</b></div>;
}

function GroupStatistics({ group }) {
  const { statistics } = group;
  if (statistics.count === 1) {
    return (
      <div className="group-stats single-stat">
        <StatCell label="原值" value={statistics.original} />
        <div className="threshold-note"><Info size={18} />n=1：不計算最低、最高、平均、中位數或百分位。</div>
      </div>
    );
  }
  return (
    <div className="group-stats">
      <StatCell label="最低" value={statistics.min} />
      <StatCell label="最高" value={statistics.max} />
      <StatCell label="平均" value={statistics.average} />
      <StatCell label="中位數" value={statistics.median} />
      <StatCell label="P25" value={statistics.p25} muted={statistics.count < 4} />
      <StatCell label="P75" value={statistics.p75} muted={statistics.count < 4} />
      {statistics.count < 4 && <div className="threshold-note"><Info size={18} />n={statistics.count}：P25／P75 留空。</div>}
    </div>
  );
}

function ComparisonPage({ route, navigate, account, qwenDegraded, toggleQwen, logout, selectedIds, setSelectedIds, notify }) {
  const [evidence, setEvidence] = useState(null);
  const selectedRecords = PRICE_RECORDS.filter((record) => selectedIds.includes(record.id));
  const groups = groupSelectedRecords(selectedRecords);
  const groupIdByRecord = new Map(groups.flatMap((group) => group.records.map((record) => [record.id, group.id])));

  const copyTsv = async () => {
    const headers = ["analytics_group_id", "dataset", "record_id", "canonical_item", "price_semantic", "unit", "MOP_value", "quote_type", "scope", "basis", "transport", "source"];
    const rows = selectedRecords.map((record) => [
      groupIdByRecord.get(record.id), record.dataset, record.id, record.canonicalDescription,
      record.priceSemanticLabel, record.standardUnit, record.mopValue.toFixed(2), record.standardQuoteType,
      record.scopeLabel, record.unitCostBasisLabel, record.transportLabel, `${record.sourceDocument} ${record.sourceLocator}`,
    ]);
    const tsv = [headers, ...rows].map((row) => row.join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      notify("已複製全部已選資料為TSV，保留analytics group ID及來源。 ");
    } catch {
      notify("瀏覽器未授權剪貼簿；請使用XLSX輸出。 ");
    }
  };

  const downloadXlsx = () => {
    const anchor = document.createElement("a");
    anchor.href = `${import.meta.env.BASE_URL}assets/JWC_Search_Analytics_AL01_v001.xlsx`;
    anchor.download = "JWC_Search_Analytics_AL01_v001.xlsx";
    anchor.click();
    notify("已開始下載五頁XLSX分析報告。 ");
  };

  return (
    <div className="app-frame">
      <Sidebar route={route} navigate={navigate} account={account} />
      <div className="app-main comparison-page">
        <Topbar account={account} qwenDegraded={qwenDegraded} onToggleQwen={toggleQwen} onLogout={logout} />
        <section className="comparison-header">
          <button type="button" className="back-link" onClick={() => navigate("/search/subcontractors")}><ArrowLeft size={18} />返回搜尋</button>
          <div className="title-row">
            <div><span className="eyebrow">COMPARISON WORKSPACE</span><h1>分組分析工作區</h1></div>
            <div className="comparison-actions">
              <button type="button" className="button ghost" onClick={() => setSelectedIds(THRESHOLD_DEMO_SELECTION)}><SlidersHorizontal size={18} />載入 n=1／2–3／≥4 示例</button>
              <button type="button" className="button secondary" onClick={copyTsv} disabled={!selectedRecords.length}><Copy size={18} />複製 TSV</button>
              <button type="button" className="button primary" onClick={downloadXlsx} disabled={!selectedRecords.length}><FileXls size={18} />下載 XLSX 分析報告</button>
            </div>
          </div>
          <div className="comparison-summary">
            <div><span>選取筆數</span><b>{selectedRecords.length}</b></div>
            <div><span>分析組數</span><b>{groups.length}</b></div>
            <p><ShieldCheck size={20} weight="fill" /><span><b>全部已選資料都會顯示。</b>不同價格語義、單位、報價類型、scope、basis或運輸條件會自動拆組；沒有跨組overall average。</span></p>
          </div>
        </section>
        <div className={evidence ? "comparison-workspace with-evidence" : "comparison-workspace"}>
          <main className="group-list">
            {!selectedRecords.length && (
              <div className="empty-state"><SlidersHorizontal size={34} /><h2>比較工作區尚未有資料</h2><p>從任何S1、S2或S3搜尋結果加入價格記錄。</p><button type="button" className="button primary" onClick={() => navigate("/search/subcontractors")}>前往搜尋</button></div>
            )}
            {groups.map((group) => {
              const anchor = group.records[0];
              return (
                <section className="analytics-group" key={group.key}>
                  <header>
                    <div className="group-id">{group.id}</div>
                    <div>
                      <span>{datasetLabel(anchor.dataset)} · {anchor.itemCode}</span>
                      <h2>{anchor.priceSemanticLabel} · MOP/{anchor.standardUnit}</h2>
                      <p>{anchor.standardQuoteType} · {anchor.scopeLabel} · {anchor.unitCostBasisLabel} · 運輸：{anchor.transportLabel}</p>
                    </div>
                    <SemanticPill>{group.records.length} 筆樣本</SemanticPill>
                  </header>
                  <div className="group-record-table">
                    <table>
                      <thead><tr><th>記錄</th><th>公司／項目</th><th>原始描述</th><th className="numeric">MOP值</th><th>曾選用</th><th>來源證據</th></tr></thead>
                      <tbody>
                        {group.records.map((record) => (
                          <tr key={record.id}>
                            <td><b>{record.id}</b><small>{record.dataset}</small></td>
                            <td><b>{record.counterparty}</b><small>{record.project}</small></td>
                            <td>{record.rawDescription}</td>
                            <td className="numeric price-cell">{formatMop(record.mopValue)} / {record.standardUnit}</td>
                            <td>{record.used ? "是" : "否"}</td>
                            <td><button type="button" className="source-link" onClick={() => setEvidence(record)}>{record.sourceDocument}<CaretRight size={15} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <GroupStatistics group={group} />
                </section>
              );
            })}
          </main>
          <EvidenceDrawer record={evidence} onClose={() => setEvidence(null)} notify={notify} />
        </div>
      </div>
    </div>
  );
}

function AdminHeader({ title, description }) {
  return (
    <header className="admin-page-header">
      <div><span className="eyebrow">DATABASE ADMIN</span><h1>{title}</h1><p>{description}</p></div>
      <span className="admin-access"><ShieldCheck size={17} weight="fill" />獨立管理員權限</span>
    </header>
  );
}

function StatusRail({ status }) {
  const statuses = Object.keys(STATUS_COPY);
  const currentIndex = statuses.indexOf(status);
  return (
    <ol className="status-rail" aria-label="Atomic import狀態">
      {statuses.map((item, index) => {
        const active = item === status;
        const passed =
          (item === "UPLOAD" && ["READY_TO_PUBLISH", "PUBLISHED", "ROLLED_BACK"].includes(status)) ||
          (item === "READY_TO_PUBLISH" && ["PUBLISHED", "ROLLED_BACK"].includes(status)) ||
          (item === "PUBLISHED" && status === "ROLLED_BACK");
        return (
          <li key={item} className={`${active ? "active" : ""} ${passed ? "passed" : ""}`}>
            <span>{passed ? <Check size={15} weight="bold" /> : index + 1}</span>
            <b>{STATUS_COPY[item]}</b>
          </li>
        );
      })}
    </ol>
  );
}

function AdminImports({ notify }) {
  const [status, setStatus] = useState("UPLOAD");
  const [file, setFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);

  const loadSample = () => {
    setFile("S2_AL01_v004_sanitized.xlsx");
    setStatus("UPLOAD");
    setErrors([]);
  };
  const validate = (shouldFail = false) => {
    if (!file) {
      notify("請先選擇v004 workbook或載入AL01示例。 ");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (shouldFail) {
        setStatus("VALIDATION_FAILED");
        setErrors([
          "Row 18：缺少 canonical_work_item_id",
          "Row 24：standard_unit 無法確認",
          "Row 31：source locator 缺少 sheet／row",
        ]);
        notify("整批拒絕：3筆business row未通過pre-insert validation。 ");
      } else {
        setStatus("READY_TO_PUBLISH");
        setErrors([]);
        notify("驗證通過：15筆記錄已達發布條件；尚未寫入business tables。 ");
      }
    }, 700);
  };
  const publish = () => {
    setStatus("PUBLISHED");
    notify("已以單一transaction發布15筆記錄；所有記錄可搜尋及比較。 ");
  };
  const rollback = () => {
    setStatus("ROLLED_BACK");
    notify("已停用整個published batch並恢復前一snapshot；Audit已保留。 ");
  };

  return (
    <>
      <AdminHeader title="Atomic Import Batches" description="先完整驗證，再由一名授權Admin明確發布；任何business row失敗即拒絕整批。" />
      <StatusRail status={status} />
      <div className="admin-two-col">
        <section className="admin-card import-card">
          <header><div><span className="eyebrow">BATCH IMP-20260801-001</span><h2>v004 Workbook 入庫</h2></div><SemanticPill tone={status === "VALIDATION_FAILED" ? "red" : status === "PUBLISHED" ? "green" : "blue"}>{status}</SemanticPill></header>
          <div className="upload-zone">
            <UploadSimple size={30} />
            <b>{file || "選擇人工整理完成的v004 workbook"}</b>
            <span>Importer不猜測canonical item、單位、scope、basis、匯率或allocation。</span>
            <label className="button secondary">
              <input type="file" accept=".xlsx" onChange={(event) => { setFile(event.target.files?.[0]?.name ?? ""); setStatus("UPLOAD"); setErrors([]); }} />
              選擇檔案
            </label>
            <button type="button" className="button ghost" onClick={loadSample}>載入AL01消敏示例</button>
          </div>
          {errors.length > 0 && (
            <div className="validation-errors" role="alert">
              <h3><WarningCircle size={19} weight="fill" />VALIDATION_FAILED</h3>
              {errors.map((error) => <p key={error}>{error}</p>)}
              <small>沒有任何business record被寫入production tables。</small>
            </div>
          )}
          {status === "READY_TO_PUBLISH" && (
            <div className="validation-success"><CheckCircle size={22} weight="fill" /><span><b>15／15 business rows 通過</b><small>canonical、unit、MOP、semantic、scope、basis及source evidence齊全。</small></span></div>
          )}
          <div className="admin-card-actions">
            <button type="button" className="button ghost" onClick={() => validate(true)} disabled={busy || !file}>模擬缺欄失敗</button>
            <button type="button" className="button secondary" onClick={() => validate(false)} disabled={busy || !file}>{busy ? <SpinnerGap className="spin" size={18} /> : <ShieldCheck size={18} />}驗證整批</button>
            <button type="button" className="button primary" onClick={publish} disabled={status !== "READY_TO_PUBLISH"}>發布至production</button>
            <button type="button" className="button danger" onClick={rollback} disabled={status !== "PUBLISHED"}>Rollback batch</button>
          </div>
        </section>
        <aside className="admin-card contract-card">
          <span className="eyebrow">IMPORT CONTRACT</span>
          <h2>正式資料邊界</h2>
          <ul className="check-list">
            <li><Check size={16} />沒有partial import</li>
            <li><Check size={16} />沒有review／pending business state</li>
            <li><Check size={16} />title、subtotal、cancel、missing、client-supplied及formula error不入庫</li>
            <li><Check size={16} />batch、error report及audit屬control data</li>
            <li><Check size={16} />rollback不刪歷史audit</li>
          </ul>
          <div className="transaction-note"><Database size={21} /><span><b>單一transaction</b><small>source documents → items → links → work items → price records</small></span></div>
        </aside>
      </div>
    </>
  );
}

function AdminCanonical({ notify }) {
  const [aliases, setAliases] = useState(["鋁扣板天花", "鋁扣天花", "aluminium ceiling tile", "metal ceiling"]);
  const [aliasDraft, setAliasDraft] = useState("");
  const addAlias = (event) => {
    event.preventDefault();
    if (!aliasDraft.trim() || aliases.includes(aliasDraft.trim())) return;
    setAliases((current) => [...current, aliasDraft.trim()]);
    setAliasDraft("");
    notify("已新增approved alias並建立可回復Audit版本。 ");
  };
  return (
    <>
      <AdminHeader title="Canonical Names／Aliases" description="保留raw name，canonical使用不可變ID；merge／split不會硬刪舊ID或歷史證據。" />
      <div className="admin-two-col">
        <section className="admin-card canonical-card">
          <header><div><span className="eyebrow">CANONICAL WORK ITEM</span><h2>WI-AL01-CEILING-001</h2></div><SemanticPill tone="green">ACTIVE</SemanticPill></header>
          <dl className="canonical-facts">
            <div><dt>Item code</dt><dd>AL01</dd></div>
            <div><dt>中文標準名稱</dt><dd>鋁質方形扣板天花</dd></div>
            <div><dt>English name</dt><dd>Aluminium square lay-in ceiling tile</dd></div>
            <div><dt>Standard unit</dt><dd>m²</dd></div>
          </dl>
          <h3>Approved aliases</h3>
          <div className="alias-list">{aliases.map((alias) => <span key={alias}>{alias}<button type="button" aria-label={`停用別名 ${alias}`} onClick={() => { setAliases((current) => current.filter((item) => item !== alias)); notify("別名已停用；舊版本仍可追溯。 "); }}><X size={14} /></button></span>)}</div>
          <form className="inline-form" onSubmit={addAlias}><label><span className="sr-only">新增別名</span><input value={aliasDraft} onChange={(event) => setAliasDraft(event.target.value)} placeholder="輸入中英文、舊名、簡稱或慣用語" /></label><button type="submit" className="button primary"><Plus size={17} />新增approved alias</button></form>
        </section>
        <aside className="admin-card">
          <span className="eyebrow">GOVERNANCE</span><h2>名稱治理規則</h2>
          <ul className="check-list"><li><Check size={16} />raw description永遠保留</li><li><Check size={16} />同名公司不按文字自動合併</li><li><Check size={16} />merge使用merged_into_id</li><li><Check size={16} />Qwen expansion不直接寫alias table</li><li><Check size={16} />before／after、evidence、Admin及時間全部留Audit</li></ul>
        </aside>
      </div>
    </>
  );
}

function AdminFx({ notify }) {
  const [rates, setRates] = useState({ RMB: "1.20", HKD: "1.03" });
  const update = () => notify(`已覆蓋現行匯率：RMB ${Number(rates.RMB).toFixed(4)}、HKD ${Number(rates.HKD).toFixed(4)}；歷史MOP不重算。`);
  return (
    <>
      <AdminHeader title="Current Exchange Rates" description="管理員直接覆蓋目前值；不保存rate version或effective history，每筆business record仍保存自身exchange_rate_used。" />
      <section className="admin-card fx-card">
        <header><div><span className="eyebrow">STANDARD DISPLAY CURRENCY</span><h2>MOP</h2></div><SemanticPill>2026-08-01 current</SemanticPill></header>
        <div className="fx-grid">
          {Object.entries(rates).map(([currency, rate]) => (
            <label key={currency}><span>1 {currency} =</span><input type="number" min="0" step="0.0001" value={rate} onChange={(event) => setRates((current) => ({ ...current, [currency]: event.target.value }))} /><b>MOP</b></label>
          ))}
        </div>
        <div className="fx-warning"><Info size={20} /><span><b>歷史證據不重算</b><small>例如AL01的150 CNY使用1.15換算為172.50 MOP，會永久保留該筆採用匯率。</small></span></div>
        <button type="button" className="button primary" onClick={update}>覆蓋現行匯率</button>
      </section>
    </>
  );
}

function AdminAccounts({ notify }) {
  return (
    <>
      <AdminHeader title="Accounts／Password Reset" description="user1–user10皆為SEARCH_USER；一般用戶不能進入Admin路由，亦沒有自助改密碼或forgot-password。" />
      <section className="admin-card admin-table-card">
        <table className="admin-table"><thead><tr><th>Account</th><th>Role</th><th>Status</th><th>最近安全事件</th><th>Admin action</th></tr></thead><tbody>
          {ADMIN_ACCOUNTS.map((account) => <tr key={account.id}><td><b>{account.id}</b></td><td>{account.role}</td><td><SemanticPill tone={account.status === "ACTIVE" ? "green" : "red"}>{account.status}</SemanticPill></td><td>{account.lastSecurityEvent}</td><td><button type="button" className="button ghost small" onClick={() => notify(`${account.id}已reset：產生新的CSPRNG密碼、覆蓋Argon2id hash並撤銷sessions；Prototype不顯示秘密。`)}>Reset／Reissue</button></td></tr>)}
        </tbody></table>
      </section>
    </>
  );
}

function AdminFeedback({ notify }) {
  return (
    <>
      <AdminHeader title="Anonymous Feedback Review" description="只保存record ID、route、原因、聚合次數、版本及時間；不保存query、帳戶、IP、裝置或個人搜尋歷史。" />
      <section className="admin-card admin-table-card">
        <table className="admin-table"><thead><tr><th>ID</th><th>Record／Route</th><th>原因</th><th>30日次數</th><th>狀態</th><th>Action</th></tr></thead><tbody>
          {ANONYMOUS_FEEDBACK.map((feedback) => <tr key={feedback.id}><td><b>{feedback.id}</b></td><td><b>{feedback.recordId}</b><small>{feedback.route}</small></td><td>{feedback.reason}</td><td>{feedback.count}</td><td><SemanticPill tone={feedback.count >= 3 ? "red" : "blue"}>{feedback.status}</SemanticPill></td><td><button type="button" className="button ghost small" disabled={feedback.count < 3} onClick={() => notify("已建立修正提案；需一名業務代表批准及通過固定30-query regression才可發布。 ")}>建立修正提案</button></td></tr>)}
        </tbody></table>
        <p className="retention-note"><ClockCounterClockwise size={18} />Raw feedback保存180日；feedback永遠不能直接修改canonical name、alias、價格、分類、link或曾選用。</p>
      </section>
    </>
  );
}

function AdminAudit() {
  const events = [
    ["AUD-9081", "IMPORT_BATCH_VALIDATED", "IMP-20260801-001", "2026-08-01 10:18", "15／15 rows passed"],
    ["AUD-9074", "ALIAS_VERSION_PUBLISHED", "WI-AL01-CEILING-001", "2026-08-01 09:42", "before／after evidence retained"],
    ["AUD-9068", "CURRENT_FX_OVERWRITTEN", "RMB→MOP", "2026-08-01 09:15", "historical MOP unchanged"],
    ["AUD-9051", "IMPORT_BATCH_ROLLED_BACK", "IMP-20260731-008", "2026-07-31 17:20", "snapshot restored; audit retained"],
  ];
  return (
    <>
      <AdminHeader title="Audit／Rollback" description="系統控制事件append-only；rollback停用整批並恢復前一snapshot，不刪除已存在的歷史事件。" />
      <section className="admin-card admin-table-card"><table className="admin-table"><thead><tr><th>Event ID</th><th>Event</th><th>Target</th><th>Timestamp</th><th>Evidence</th></tr></thead><tbody>{events.map((event) => <tr key={event[0]}>{event.map((value, index) => <td key={value}>{index === 0 ? <b>{value}</b> : value}</td>)}</tr>)}</tbody></table></section>
    </>
  );
}

function AdminPage({ route, navigate, account, qwenDegraded, toggleQwen, logout, notify }) {
  if (account?.role !== "ADMIN") {
    return (
      <main className="access-denied"><LockKey size={42} /><h1>一般Search User不能進入Admin路由</h1><p>請使用Database Admin示範登入；搜尋帳戶只可查看、比較、複製及下載正式business records。</p><button type="button" className="button primary" onClick={() => navigate("/login?role=admin")}>前往管理員登入</button></main>
    );
  }
  let content = <AdminImports notify={notify} />;
  if (route === "/admin/canonical") content = <AdminCanonical notify={notify} />;
  if (route === "/admin/fx") content = <AdminFx notify={notify} />;
  if (route === "/admin/accounts") content = <AdminAccounts notify={notify} />;
  if (route === "/admin/feedback") content = <AdminFeedback notify={notify} />;
  if (route === "/admin/audit") content = <AdminAudit />;
  return (
    <div className="app-frame">
      <Sidebar route={route} navigate={navigate} account={account} />
      <div className="app-main admin-main">
        <Topbar account={account} qwenDegraded={qwenDegraded} onToggleQwen={toggleQwen} onLogout={logout} />
        <main className="admin-content">{content}</main>
      </div>
    </div>
  );
}

export function App() {
  const [route, navigate] = useAppRoute();
  const [account, setAccount] = useState({ username: "user1", role: "SEARCH_USER" });
  const [selectedIds, setSelectedIds] = useState(INITIAL_SELECTION);
  const [qwenDegraded, setQwenDegraded] = useState(false);
  const [toast, setToast] = useState("");

  const login = (nextAccount) => {
    setAccount(nextAccount);
    navigate(nextAccount.role === "ADMIN" ? "/admin/imports" : "/search/subcontractors");
  };
  const logout = () => {
    setAccount(null);
    navigate("/login");
  };
  const toggleQwen = () => setQwenDegraded((current) => !current);

  let page;
  if (route.startsWith("/login")) {
    page = <LoginPage onLogin={login} />;
  } else if (route.startsWith("/admin")) {
    page = <AdminPage route={route} navigate={navigate} account={account} qwenDegraded={qwenDegraded} toggleQwen={toggleQwen} logout={logout} notify={setToast} />;
  } else if (route === "/compare") {
    page = <ComparisonPage route={route} navigate={navigate} account={account} qwenDegraded={qwenDegraded} toggleQwen={toggleQwen} logout={logout} selectedIds={selectedIds} setSelectedIds={setSelectedIds} notify={setToast} />;
  } else {
    page = <SearchPage route={route} navigate={navigate} account={account} qwenDegraded={qwenDegraded} toggleQwen={toggleQwen} logout={logout} selectedIds={selectedIds} setSelectedIds={setSelectedIds} notify={setToast} />;
  }

  return (
    <>
      {page}
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
