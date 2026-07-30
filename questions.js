// ============================================================
// APOLO Pipeline Trainer — Question Bank (25 questions)
// Built directly from: create_table_Apolo.sql, create_table_Staging_Apolo.sql,
// intruksi.sql, Mapping_laporan_Publikasi_APOLO.xlsx, Data_Pembanding_LPK01A.xlsx,
// CREATE_TABLE_TAMBAHAN.txt
// ============================================================

const QUESTIONS = [

// ---------------------------------------------------------------
// 1. ORDER — ETL fundamentals
// ---------------------------------------------------------------
{
  id:1, type:"order", category:"ETL Fundamentals",
  title:"The Three Stages of ETL",
  prompt:"Before touching APOLO's tables, drag these three stages into the order data actually flows through in any ETL pipeline.",
  items:[
    {id:"extract", text:"Extract — pull raw data out of a source system (e.g. the core banking / Antasena system)"},
    {id:"transform", text:"Transform — clean, group, calculate and reshape the data (e.g. apply REF_LPBK grouping rules)"},
    {id:"load", text:"Load — write the finished data into its destination table for reporting (e.g. APOLO..LPBK_01A)"}
  ],
  correctOrder:["extract","transform","load"],
  explanation:"E-T-L is the backbone of everything you'll do in APOLO. In this pipeline: <span class='term'>Extract</span> = the raw <b>Source_Neraca / Source_Laba_Rugi / Source_Rekening_Administratif</b> tables in Staging_APOLO, already pulled from the core banking system. <span class='term'>Transform</span> = the <b>_source → _TEMP</b> steps, where amounts get grouped and signed (add/subtract) using the <b>REF_LPBK_xxA_GRUP</b> reference tables. <span class='term'>Load</span> = writing the final, report-ready rows into <b>LPBK_01A/02A/03A</b> in Staging_APOLO (ODS) and then into APOLO (Final) for publication. Every other question in this game is really just this one idea, zoomed in."
},

// ---------------------------------------------------------------
// 2. SORT — which database does each object live in
// ---------------------------------------------------------------
{
  id:2, type:"sort", category:"Database Architecture",
  title:"Staging_APOLO, APOLO, or Neither?",
  prompt:"APOLO's world has two databases: <code>Staging_APOLO</code> (working area) and <code>APOLO</code> (published, final data). Some objects live in only one place, some in both — and some aren't part of this pipeline at all. Sort each table into the right bin.",
  bins:[
    {id:"staging", title:"Staging_APOLO only"},
    {id:"both", title:"Lives in BOTH databases"},
    {id:"notpipeline", title:"Not part of the APOLO pipeline"}
  ],
  items:[
    {id:"i1", text:"LPBK_01A_source", bin:"staging"},
    {id:"i2", text:"LPBK_01A_TEMP", bin:"staging"},
    {id:"i3", text:"Source_Neraca", bin:"staging"},
    {id:"i4", text:"REF_LPBK_03A_GRUP", bin:"staging"},
    {id:"i5", text:"LPBK_01A", bin:"both"},
    {id:"i6", text:"REF_LPBK_01A_GRUP", bin:"both"},
    {id:"i7", text:"Ref_Kantor", bin:"both"},
    {id:"i8", text:"LPBK_02A", bin:"both"},
    {id:"i9", text:"produk", bin:"notpipeline"},
    {id:"i10", text:"pelanggan", bin:"notpipeline"},
    {id:"i11", text:"penjualan", bin:"notpipeline"}
  ],
  explanation:"<code>create_table_Apolo.sql</code> only creates six objects inside APOLO: <b>LPBK_01A, LPBK_02A, LPBK_03A, Ref_Kantor, REF_LPBK_01A_GRUP</b> and <b>REF_LPBK_02A_GRUP</b> — every one of those also exists in Staging_APOLO (that's exactly why <code>intruksi.sql</code> has to write <code>APOLO..Ref_Kantor</code> to disambiguate). Notice there is <b>no table that exists only in APOLO</b> — APOLO only ever receives a final copy of something staging already built. Also notice <span class='term'>REF_LPBK_03A_GRUP</span> is a trap: it's created in Staging_APOLO but was never added to the APOLO creation script, so it stays staging-only. Finally, <b>produk / pelanggan / penjualan</b> come from <code>CREATE_TABLE_TAMBAHAN.txt</code> — a completely separate practice schema, unrelated to the bank-reporting pipeline."
},

// ---------------------------------------------------------------
// 3. ORDER — LPBK_01A pipeline (Neraca)
// ---------------------------------------------------------------
{
  id:3, type:"order", category:"Pipeline Sequencing",
  title:"Trace the LPBK_01A (Neraca) Pipeline",
  prompt:"LPBK_01A is the monthly Balance Sheet (Laporan Posisi Keuangan Bulanan). Drag these five checkpoints from <code>intruksi.sql</code> into the order the data physically passes through them.",
  items:[
    {id:"s1", text:"Staging_APOLO..Source_Neraca — raw balance-sheet rows already landed from the core banking system"},
    {id:"s2", text:"Staging_APOLO..LPBK_01A_source — built by SSIS_LPBK_01A_SOURCE.dtsx"},
    {id:"s3", text:"Staging_APOLO..LPBK_01A_TEMP — built by SSIS_LPBK_01A_TEMP.dtsx (grouping applied via REF_LPBK_01A_GRUP)"},
    {id:"s4", text:"Staging_APOLO..LPBK_01A — built by SSIS_LPBK_01A_ODS.dtsx"},
    {id:"s5", text:"APOLO..LPBK_01A — built by SSIS_LPBK_01A_FINAL.dtsx (the published report)"}
  ],
  correctOrder:["s1","s2","s3","s4","s5"],
  explanation:"This is the literal order laid out in <code>intruksi.sql</code>. Each arrow (<code>--&gt;&gt;</code>) points to the SSIS package responsible for building the next table: <span class='term'>SOURCE</span> shapes the raw Neraca rows into <b>LPBK_01A_source</b>, <span class='term'>TEMP</span> applies the component/grouping logic to produce <b>LPBK_01A_TEMP</b>, <span class='term'>ODS</span> loads the cleaned result into Staging_APOLO's own <b>LPBK_01A</b>, and <span class='term'>FINAL</span> pushes that into <b>APOLO..LPBK_01A</b> — the table people actually query for the published report. All five packages are then wrapped by <code>SSIS_LPBK_01A_MENU.dtsx</code> so they can run as one job."
},

// ---------------------------------------------------------------
// 4. ORDER — LPBK_02A pipeline (Laba Rugi)
// ---------------------------------------------------------------
{
  id:4, type:"order", category:"Pipeline Sequencing",
  title:"Trace the LPBK_02A (Laba Rugi) Pipeline",
  prompt:"LPBK_02A is the monthly Income Statement (Laporan Laba Rugi dan Penghasilan Komprehensif Lain). Same idea, different report — order these checkpoints.",
  items:[
    {id:"s1", text:"Staging_APOLO..Source_Laba_Rugi — raw profit & loss rows from the core banking system"},
    {id:"s2", text:"staging_apolo.dbo.LPBK_02A_Source — built by SSIS_LPBK_02A_SOURCE.dtsx"},
    {id:"s3", text:"staging_apolo.dbo.LPBK_02A_TEMP — built by SSIS_LPBK_02A_TEMP.dtsx (grouped via REF_LPBK_02A_GRUP)"},
    {id:"s4", text:"staging_apolo.dbo.LPBK_02A — built by SSIS_LPBK_02A_ODS.dtsx"},
    {id:"s5", text:"APOLO.dbo.LPBK_02A — built by SSIS_LPBK_02A_FINAL.dtsx"}
  ],
  correctOrder:["s1","s2","s3","s4","s5"],
  explanation:"Identical shape to the Neraca pipeline, just swap the source: <b>Source_Laba_Rugi</b> instead of Source_Neraca. One extra detail worth knowing — <code>LPBK_02A_Source</code> only has 3 raw columns (<code>Kode Komponen</code>, <code>POS - POS</code>, <code>INDIVIDUAL</code>), it's a lightweight staging shape, not the full 30+ column Source_Laba_Rugi table. The heavy lifting (grouping, sign, hierarchy) happens later in <span class='term'>LPBK_02A_TEMP</span> using <b>REF_LPBK_02A_GRUP</b>."
},

// ---------------------------------------------------------------
// 5. ORDER — LPBK_03A pipeline (Rekening Administratif)
// ---------------------------------------------------------------
{
  id:5, type:"order", category:"Pipeline Sequencing",
  title:"Trace the LPBK_03A (Rekening Administratif) Pipeline",
  prompt:"LPBK_03A is the monthly Commitments & Contingencies report (Laporan Komitmen dan Kontinjensi Bulanan). Order its checkpoints.",
  items:[
    {id:"s1", text:"Staging_APOLO..Source_Rekening_Administratif — raw commitment/contingency rows"},
    {id:"s2", text:"staging_apolo.dbo.LPBK_03A_Source — built by SSIS_LPBK_03A_SOURCE.dtsx"},
    {id:"s3", text:"staging_apolo.dbo.LPBK_03A_TEMP — built by SSIS_LPBK_03A_TEMP.dtsx (grouped via REF_LPBK_03A_GRUP)"},
    {id:"s4", text:"staging_apolo.dbo.LPBK_03A — built by SSIS_LPBK_03A_ODS.dtsx"},
    {id:"s5", text:"APOLO.dbo.LPBK_03A — built by SSIS_LPBK_03A_FINAL.dtsx"}
  ],
  correctOrder:["s1","s2","s3","s4","s5"],
  explanation:"Same five-stage shape again — by now the pattern should feel automatic: <b>raw source → _source → _TEMP → staging ODS table → APOLO final table</b>. One thing that makes LPBK_03A special: its <code>LPBK_03A_TEMP</code> table has an extra <code>Grup</code> column that the other two reports' TEMP tables don't have (you'll meet that detail again later in this game)."
},

// ---------------------------------------------------------------
// 6. MATCH — SSIS package suffix -> purpose
// ---------------------------------------------------------------
{
  id:6, type:"match", category:"SSIS Packages",
  title:"What Does Each SSIS Package Suffix Do?",
  prompt:"Every APOLO report (01A/02A/03A) is built by the same five-package pattern. Drag each purpose onto the suffix it belongs to.",
  left:[
    {id:"l1", text:"...SOURCE.dtsx"},
    {id:"l2", text:"...TEMP.dtsx"},
    {id:"l3", text:"...ODS.dtsx"},
    {id:"l4", text:"...FINAL.dtsx"},
    {id:"l5", text:"...MENU.dtsx"}
  ],
  right:[
    {id:"r1", text:"Pulls raw data from the Source_* staging table and produces the first shaped '_source' / '_Source' table", matches:"l1"},
    {id:"r2", text:"Applies the REF_LPBK_xxA_GRUP grouping/hierarchy rules to build the '_TEMP' table", matches:"l2"},
    {id:"r3", text:"Loads the cleaned TEMP data into the Staging_APOLO version of the report table (the ODS layer)", matches:"l3"},
    {id:"r4", text:"Publishes the ODS table's data into the APOLO database — this is the version end users query", matches:"l4"},
    {id:"r5", text:"Orchestrates SOURCE → TEMP → ODS → FINAL as a single runnable job", matches:"l5"}
  ],
  explanation:"This suffix pattern is APOLO's naming convention and it repeats identically for 01A, 02A and 03A: <span class='term'>SOURCE</span> extracts and does light shaping, <span class='term'>TEMP</span> is where the real transformation (grouping + sign logic) happens, <span class='term'>ODS</span> lands the result inside Staging_APOLO's own copy of the final table shape, <span class='term'>FINAL</span> copies that across to APOLO, and <span class='term'>MENU</span> is the parent package that chains all four together so operations can trigger one job instead of four. Once you recognize this pattern, reading any new SSIS package name in this codebase becomes predictable."
},

// ---------------------------------------------------------------
// 7. MATCH — table -> distinguishing purpose/column
// ---------------------------------------------------------------
{
  id:7, type:"match", category:"Schema Literacy",
  title:"Match Each Table to What Makes It Unique",
  prompt:"Every table in this pipeline has one column or trait that tells you exactly what it's for. Match the table to its defining feature.",
  left:[
    {id:"l1", text:"Source_Neraca"},
    {id:"l2", text:"Source_Laba_Rugi"},
    {id:"l3", text:"Source_Rekening_Administratif"},
    {id:"l4", text:"Ref_Kantor"},
    {id:"l5", text:"REF_LPBK_01A_GRUP"}
  ],
  right:[
    {id:"r1", text:"Has a Pos_Neraca column — the raw balance-sheet position code", matches:"l1"},
    {id:"r2", text:"Has a Pos_LabaRugi column plus separate Penduduk/Bukan_Penduduk (resident / non-resident) amount columns", matches:"l2"},
    {id:"r3", text:"Has a POS_REKENING column — the raw commitment/contingency position code", matches:"l3"},
    {id:"r4", text:"Reference table mapping a branch SANDI code to its KETERANGAN (branch name) and kode_cabang", matches:"l4"},
    {id:"r5", text:"Reference table holding Kode_Komponen, Header, HeaderNo, calc — the hierarchy rules for building LPBK_01A", matches:"l5"}
  ],
  explanation:"Each Source_* table is scoped to exactly one report and carries a position-code column named after that report (<code>Pos_Neraca</code>, <code>Pos_LabaRugi</code>, <code>POS_REKENING</code>) — that's your fastest way to tell them apart at a glance. <code>Ref_Kantor</code> is a general-purpose branch lookup used across all three reports (it even has its own <code>kode_cabang</code> distinct from the branch <code>SANDI</code>). <code>REF_LPBK_01A_GRUP</code> is not source data at all — it's the rulebook the TEMP package reads to know how to group and roll up components."
},

// ---------------------------------------------------------------
// 8. MATCH — report code -> business meaning
// ---------------------------------------------------------------
{
  id:8, type:"match", category:"Domain Knowledge",
  title:"What Does Each Report Actually Report?",
  prompt:"Match each APOLO report code to what it represents in plain English.",
  left:[
    {id:"l1", text:"LPBK_01A"},
    {id:"l2", text:"LPBK_02A"},
    {id:"l3", text:"LPBK_03A"}
  ],
  right:[
    {id:"r1", text:"Monthly Balance Sheet (Laporan Posisi Keuangan Bulanan) — assets, liabilities, equity", matches:"l1"},
    {id:"r2", text:"Monthly Income Statement (Laporan Laba Rugi dan Penghasilan Komprehensif Lain) — revenue, expenses, profit", matches:"l2"},
    {id:"r3", text:"Monthly Commitments & Contingencies (Laporan Komitmen dan Kontinjensi Bulanan) — off-balance-sheet exposures", matches:"l3"}
  ],
  explanation:"These come straight from the mapping workbook headers: <b>Form 01A</b> = 'LAPORAN POSISI KEUANGAN BULANAN' (Balance Sheet), <b>Form 02A</b> = 'LAPORAN LABA RUGI DAN PENGHASILAN KOMPREHENSIF LAIN BULANAN' (Income Statement), <b>Form 03A</b> = 'LAPORAN KOMITMEN DAN KONTINJENSI BULANAN' (Commitments & Contingencies). Knowing this mapping matters because it tells you *what kind of number* you're looking at before you even open the table — Neraca amounts are point-in-time balances, Laba Rugi amounts are period totals, and Rekening Administratif amounts are off-balance-sheet exposure amounts."
},

// ---------------------------------------------------------------
// 9. MATCH — REF_LPBK_02A_GRUP column -> role
// ---------------------------------------------------------------
{
  id:9, type:"match", category:"Reference Tables",
  title:"Decode the REF_LPBK_02A_GRUP Columns",
  prompt:"This is the rulebook table that turns flat component codes into a rolled-up report. Match each column to its role.",
  left:[
    {id:"l1", text:"Kode_Komponen"},
    {id:"l2", text:"Header"},
    {id:"l3", text:"HeaderNo"},
    {id:"l4", text:"subheader"},
    {id:"l5", text:"calc"}
  ],
  right:[
    {id:"r1", text:"The full 18-digit unique code identifying this exact line item, e.g. '020101010100000000'", matches:"l1"},
    {id:"r2", text:"The shorter prefix of the code that identifies this item's parent group, e.g. '0201010101'", matches:"l2"},
    {id:"r3", text:"How many digit-groups deep this item sits in the hierarchy (2 = broadest group, 6 = most detailed)", matches:"l3"},
    {id:"r4", text:"The remaining digits of the code that aren't part of the Header — this item's own segment", matches:"l4"},
    {id:"r5", text:"A sign multiplier (1 or -1) telling the aggregation whether this component adds to or subtracts from its parent total", matches:"l5"}
  ],
  explanation:"This table is basically a chart-of-accounts hierarchy encoded into fixed-width numeric codes. <b>Kode_Komponen</b> is the full code; <b>Header</b>+<b>subheader</b> together reconstruct it (Header is the parent prefix, subheader is what's left); <b>HeaderNo</b> tells you the depth (you'll drill into this in another question). <b>calc</b> is the detail people miss most often: for example the row for 'Beban Bunga / Imbal Hasil' (interest expense, code 020101010200000000) has <code>calc = -1</code>, while 'Pendapatan Bunga/Imbal Hasil' (interest income, code 020101010100000000) has <code>calc = 1</code> — that's literally how the TEMP package knows to subtract expenses and add income when it rolls numbers up to a subtotal."
},

// ---------------------------------------------------------------
// 10. MATCH — mapping excel column -> meaning
// ---------------------------------------------------------------
{
  id:10, type:"match", category:"Mapping Workbook",
  title:"Read a Row From the Mapping Workbook",
  prompt:"Mapping_laporan_Publikasi_APOLO.xlsx documents, for every published line, exactly where its number comes from. Match each column to what it tells you.",
  left:[
    {id:"l1", text:"Kode Komponen"},
    {id:"l2", text:"Source"},
    {id:"l3", text:"Field"},
    {id:"l4", text:"Rule"},
    {id:"l5", text:"INDIVIDUAL"}
  ],
  right:[
    {id:"r1", text:"The published line item's unique hierarchy code, e.g. '010101020000000000'", matches:"l1"},
    {id:"r2", text:"Which staging source view/table the amount is pulled from, e.g. 'NERACA_ANTASENA'", matches:"l2"},
    {id:"r3", text:"Which column in that source holds the actual amount, e.g. 'Jumlah'", matches:"l3"},
    {id:"r4", text:"The filter condition applied to isolate this line's rows, e.g. \"Pos Neraca in ('01.02.00.00.00.00')\"", matches:"l4"},
    {id:"r5", text:"The expected reference amount for that period — used to sanity-check the ETL output against a known figure", matches:"l5"}
  ],
  explanation:"Think of each row in this workbook as a spec you could hand-translate into SQL: <i>\"take <span class='term'>Field</span> from <span class='term'>Source</span> WHERE <span class='term'>Rule</span>, and the result should equal roughly <span class='term'>INDIVIDUAL</span>.\"</i> For example, row 2 of Form 01A says Source=<code>NERACA_ANTASENA</code>, Field=<code>Jumlah</code>, Rule=<code>Pos Neraca in ('01.01.00.00.00.00')</code>, INDIVIDUAL=806329 — that single row is the entire business requirement behind one line of the TEMP transformation logic for 'Kas' (Cash). This workbook is effectively the test oracle every developer uses to validate their SSIS package."
},

// ---------------------------------------------------------------
// 11. MATCH — schema columns -> general purpose
// ---------------------------------------------------------------
{
  id:11, type:"match", category:"Schema Literacy",
  title:"What Are These Recurring Columns For?",
  prompt:"Almost every LPBK_xxA table repeats the same handful of columns. Match each one to its general purpose.",
  left:[
    {id:"l1", text:"Sandi_Bank"},
    {id:"l2", text:"Bulan_Data / Tahun_Data"},
    {id:"l3", text:"Periode"},
    {id:"l4", text:"Status_Record"},
    {id:"l5", text:"Approve"}
  ],
  right:[
    {id:"r1", text:"Identifies which bank the row belongs to (useful when APOLO consolidates more than one entity)", matches:"l1"},
    {id:"r2", text:"The reporting month and year this row belongs to, kept as separate text columns", matches:"l2"},
    {id:"r3", text:"The full reporting date/period as a single date value, redundant with Bulan_Data/Tahun_Data but easier to filter or sort by", matches:"l3"},
    {id:"r4", text:"A lifecycle flag tracking the row's processing state (e.g. new, edited, finalized) as it moves through the pipeline", matches:"l4"},
    {id:"r5", text:"A sign-off flag indicating whether the row has been reviewed/approved for publication", matches:"l5"}
  ],
  explanation:"These five columns show up on almost every LPBK_xxA / TEMP / ODS table because banking regulatory pipelines need to answer 'whose number, for which month, at what stage of review, is this?' on every single row. <b>Sandi_Bank</b> and <b>Bulan_Data/Tahun_Data</b> are dimension/identity columns; <b>Periode</b> is a convenience date version of the same period; <b>Status_Record</b> and <b>Approve</b> exist because regulatory numbers usually go through a review/sign-off step before being treated as final — you'll see both columns referenced together in the comparison file used to validate LPBK_01A output."
},

// ---------------------------------------------------------------
// 12. MATCH — new-practice table constraints (CREATE_TABLE_TAMBAHAN)
// ---------------------------------------------------------------
{
  id:12, type:"match", category:"SQL DDL Basics",
  title:"Read the DDL: What Does Each Constraint Do?",
  prompt:"CREATE_TABLE_TAMBAHAN.txt is your basic SQL practice file. Match each constraint/clause to what it actually enforces.",
  left:[
    {id:"l1", text:"id_produk INT IDENTITY(1,1) PRIMARY KEY"},
    {id:"l2", text:"id_penjualan INT IDENTITY(1000,1) PRIMARY KEY"},
    {id:"l3", text:"email VARCHAR(100) NOT NULL UNIQUE"},
    {id:"l4", text:"status_member VARCHAR(20) DEFAULT 'Reguler'"},
    {id:"l5", text:"stok INT DEFAULT 0"}
  ],
  right:[
    {id:"r1", text:"Auto-numbers rows starting at 1, increasing by 1 each time, and guarantees no duplicate values in this column", matches:"l1"},
    {id:"r2", text:"Auto-numbers rows too, but the counter starts at 1000 instead of 1 — so invoice IDs look distinct from other tables", matches:"l2"},
    {id:"r3", text:"Must always have a value, and that value can never repeat across two different customers", matches:"l3"},
    {id:"r4", text:"If no value is supplied on insert, the column is automatically set to 'Reguler'", matches:"l4"},
    {id:"r5", text:"If no value is supplied on insert, the column is automatically set to 0", matches:"l5"}
  ],
  explanation:"<code>IDENTITY(seed, increment)</code> controls both the starting number and the step size — <code>IDENTITY(1000,1)</code> on <code>penjualan</code> is a deliberate choice so every sales ID visibly starts at 1000+, which is a common trick to make invoice numbers look intentional rather than like raw row counters. <code>UNIQUE</code> combined with <code>NOT NULL</code> on <code>email</code> is what actually prevents two customers from registering with the same address — <code>NOT NULL</code> alone would still allow duplicate emails. <code>DEFAULT</code> only kicks in when a column is *omitted* from the INSERT statement — if you explicitly insert NULL, the default is not applied."
},

// ---------------------------------------------------------------
// 13. ORDER — Kode_Komponen hierarchy depth
// ---------------------------------------------------------------
{
  id:13, type:"order", category:"Reference Tables",
  title:"Order the Report Hierarchy From Broadest to Most Detailed",
  prompt:"REF_LPBK_02A_GRUP uses a HeaderNo value (2 through 6) to mark how deep each component sits in the report tree. Drag these real examples into order from the broadest group down to the most granular line.",
  items:[
    {id:"h2", text:"HeaderNo 2 — '0201' → whole block, e.g. 'PENDAPATAN DAN BEBAN OPERASIONAL'"},
    {id:"h3", text:"HeaderNo 3 — '020101' → sub-block, e.g. 'A. Pendapatan dan Beban Bunga / Imbal Hasil'"},
    {id:"h4", text:"HeaderNo 4 — '02010101' → group, e.g. the interest income/expense pairing group"},
    {id:"h5", text:"HeaderNo 5 — '0201010101' → line item, e.g. '1. Pendapatan Bunga/Imbal Hasil'"},
    {id:"h6", text:"HeaderNo 6 — '020101020101' → most granular sub-line, e.g. a breakdown row nested under a level-5 line"}
  ],
  correctOrder:["h2","h3","h4","h5","h6"],
  explanation:"The lower the HeaderNo, the shorter the meaningful prefix and the broader the group — HeaderNo 2 groups are practically section headers ('PENDAPATAN DAN BEBAN OPERASIONAL'), while HeaderNo 6 rows are the finest breakdown the report ever shows. This is exactly how the TEMP package knows which subtotal a leaf line rolls up into: it just walks up the Kode_Komponen prefix from HeaderNo 6 toward HeaderNo 2, summing (or subtracting, per <code>calc</code>) as it goes."
},

// ---------------------------------------------------------------
// 14. SORT — Source_Neraca columns: measure vs dimension
// ---------------------------------------------------------------
{
  id:14, type:"sort", category:"Schema Literacy",
  title:"Measures vs. Dimensions in Source_Neraca",
  prompt:"Source_Neraca has 29 columns. Sort these into 'Measure' (a numeric amount you'd sum/report) versus 'Dimension' (a value you'd filter or group by, not add up).",
  bins:[
    {id:"measure", title:"Measure (numeric amount)"},
    {id:"dimension", title:"Dimension / key"}
  ],
  items:[
    {id:"i1", text:"Jumlah", bin:"measure"},
    {id:"i2", text:"Rupiah", bin:"measure"},
    {id:"i3", text:"Valas", bin:"measure"},
    {id:"i4", text:"Pi_Jumlah", bin:"measure"},
    {id:"i5", text:"Pos_Neraca", bin:"dimension"},
    {id:"i6", text:"Sandi_Bank", bin:"dimension"},
    {id:"i7", text:"Bulan_Data", bin:"dimension"},
    {id:"i8", text:"Kode_Cabang", bin:"dimension"},
    {id:"i9", text:"Cakupan_Data", bin:"dimension"}
  ],
  explanation:"<b>Jumlah</b> ('total'), <b>Rupiah</b> (IDR-denominated amount), <b>Valas</b> (foreign-currency amount) and <b>Pi_Jumlah</b> are all numeric values you'd aggregate with SUM() — these are your measures. Everything else — <b>Pos_Neraca</b> (the position code), <b>Sandi_Bank</b>, <b>Bulan_Data</b>, <b>Kode_Cabang</b> (branch), <b>Cakupan_Data</b> (data coverage/scope flag) — describes *what* the amount is about, so you'd use them in WHERE or GROUP BY, never inside a SUM(). Mixing these up is one of the fastest ways to write a query that technically runs but reports a meaningless number."
},

// ---------------------------------------------------------------
// 15. SORT — TEMP tables: has Grup column or not
// ---------------------------------------------------------------
{
  id:15, type:"sort", category:"Schema Literacy",
  title:"Spot the Odd One Out Among the TEMP Tables",
  prompt:"All three '_TEMP' tables share almost the same 12 columns... except one has an extra column the others don't. Sort them.",
  bins:[
    {id:"extra", title:"Has an extra 'Grup' column"},
    {id:"standard", title:"Standard columns only"}
  ],
  items:[
    {id:"i1", text:"LPBK_01A_TEMP", bin:"standard"},
    {id:"i2", text:"LPBK_02A_TEMP", bin:"standard"},
    {id:"i3", text:"LPBK_03A_TEMP", bin:"extra"}
  ],
  explanation:"Comparing the three CREATE TABLE statements directly: <code>LPBK_01A_TEMP</code> and <code>LPBK_02A_TEMP</code> both stop at <code>Approve</code>, but <code>LPBK_03A_TEMP</code> adds one more column, <code>Grup varchar(5)</code>, at the very end. This kind of small schema drift is exactly the sort of thing that breaks a lazy 'SELECT *' copy-paste between packages — if you ever reuse SOURCE/TEMP logic from LPBK_01A as a template for LPBK_03A, this is the column you'd forget to add."
},

// ---------------------------------------------------------------
// 16. SORT — calc sign: add vs subtract
// ---------------------------------------------------------------
{
  id:16, type:"sort", category:"Reference Tables",
  title:"Add or Subtract? Sort by calc Value",
  prompt:"These are real rows from REF_LPBK_02A_GRUP. Based on what each line item represents, sort them by whether their <code>calc</code> value is 1 (adds to the subtotal) or -1 (subtracts from the subtotal).",
  bins:[
    {id:"add", title:"calc = 1 (adds)"},
    {id:"subtract", title:"calc = -1 (subtracts)"}
  ],
  items:[
    {id:"i1", text:"PENDAPATAN DAN BEBAN OPERASIONAL (section header)", bin:"add"},
    {id:"i2", text:"A. Pendapatan dan Beban Bunga / Imbal Hasil", bin:"add"},
    {id:"i3", text:"1. Pendapatan Bunga/Imbal Hasil (interest income)", bin:"add"},
    {id:"i4", text:"2. Beban Bunga / Imbal Hasil (interest expense)", bin:"subtract"},
    {id:"i5", text:"Pajak Penghasilan (income tax)", bin:"subtract"},
    {id:"i6", text:"b. Pendapatan (beban) pajak tangguhan (deferred tax)", bin:"subtract"}
  ],
  explanation:"The pattern is intuitive once you see it: income and section-header rollups carry <code>calc = 1</code>, expenses carry <code>calc = -1</code> — exactly what you'd expect from an income statement (Income − Expenses = Profit). The one that trips people up is <b>'b. Pendapatan (beban) pajak tangguhan'</b> (deferred tax income/expense) — even though its name literally contains 'Pendapatan' (income), it's grouped underneath 'Pajak Penghasilan' (income tax) and still carries <code>calc = -1</code>, because in this hierarchy it's a component of the tax deduction, not of operating income. Lesson: trust the <code>calc</code> column and the hierarchy position, not the label text alone."
},

// ---------------------------------------------------------------
// 17. SORT — object type: reference vs source vs output
// ---------------------------------------------------------------
{
  id:17, type:"sort", category:"Database Architecture",
  title:"Reference, Source, or Report Output?",
  prompt:"Zoom out across the whole schema. Sort each object by its role in the pipeline.",
  bins:[
    {id:"ref", title:"Reference / master data"},
    {id:"source", title:"Raw source / fact data"},
    {id:"output", title:"Final report output"}
  ],
  items:[
    {id:"i1", text:"Ref_Kantor", bin:"ref"},
    {id:"i2", text:"REF_LPBK_01A_GRUP", bin:"ref"},
    {id:"i3", text:"Ref_POSLaporanPosisikeuangan_Bulanan_Detail", bin:"ref"},
    {id:"i4", text:"Source_Neraca", bin:"source"},
    {id:"i5", text:"Source_Laba_Rugi", bin:"source"},
    {id:"i6", text:"Source_Rekening_Administratif", bin:"source"},
    {id:"i7", text:"APOLO..LPBK_01A", bin:"output"},
    {id:"i8", text:"APOLO..LPBK_02A", bin:"output"},
    {id:"i9", text:"APOLO..LPBK_03A", bin:"output"}
  ],
  explanation:"Every object in this schema plays one of three roles: <b>Reference tables</b> (prefixed <code>Ref_</code> or <code>REF_</code>) hold slowly-changing lookup data — branch names, COA-to-position mappings, hierarchy rules — that other data gets matched against. <b>Source tables</b> hold the raw, high-volume transactional facts pulled straight from the core banking system, one row per position per period. <b>Report output tables</b> are the destination: the whole point of the pipeline is to turn Source rows into these, using Reference rules along the way. Recognizing this three-way split instantly tells you which tables you're allowed to treat as 'static' versus which ones actually change every load."
},

// ---------------------------------------------------------------
// 18. SORT — generic SQL clause function
// ---------------------------------------------------------------
{
  id:18, type:"sort", category:"SQL DDL Basics",
  title:"What Job Does Each SQL Keyword Do?",
  prompt:"Foundational SQL literacy check — sort each keyword/clause by the job it does in a query.",
  bins:[
    {id:"filter", title:"Filters rows"},
    {id:"aggregate", title:"Aggregates / summarizes"},
    {id:"combine", title:"Combines tables"}
  ],
  items:[
    {id:"i1", text:"WHERE", bin:"filter"},
    {id:"i2", text:"HAVING", bin:"aggregate"},
    {id:"i3", text:"GROUP BY", bin:"aggregate"},
    {id:"i4", text:"SUM()", bin:"aggregate"},
    {id:"i5", text:"LEFT JOIN", bin:"combine"},
    {id:"i6", text:"ON", bin:"combine"}
  ],
  explanation:"<code>WHERE</code> removes rows before any grouping happens, based on raw column values. <code>GROUP BY</code> collapses many rows into one per group, <code>SUM()</code> is what actually does the math inside each group, and <code>HAVING</code> filters groups *after* aggregation (which is why you can write <code>HAVING SUM(Jumlah) > 0</code> but not <code>WHERE SUM(Jumlah) > 0</code>). <code>LEFT JOIN</code> and its <code>ON</code> clause bring columns in from a second table, keeping every row from the left table even when there's no match on the right — exactly the pattern used to attach a branch name from Ref_Kantor onto a Source_Neraca row."
},

// ---------------------------------------------------------------
// 19. ORDER — capstone full pipeline
// ---------------------------------------------------------------
{
  id:19, type:"order", category:"Boss Level",
  title:"Boss Level: The Entire APOLO Lifecycle",
  prompt:"Zoom all the way out. Drag these seven checkpoints into the order a number travels, from landing in staging to being trusted as a published, reconciled figure.",
  items:[
    {id:"a", text:"Raw data lands in a Staging_APOLO source table (Source_Neraca / Source_Laba_Rugi / Source_Rekening_Administratif)"},
    {id:"b", text:"SSIS_LPBK_xxA_SOURCE.dtsx reshapes it into the report-specific '_source' table"},
    {id:"c", text:"SSIS_LPBK_xxA_TEMP.dtsx applies REF_LPBK_xxA_GRUP hierarchy + calc sign rules to build '_TEMP'"},
    {id:"d", text:"SSIS_LPBK_xxA_ODS.dtsx loads the cleaned rows into Staging_APOLO's own LPBK_xxA table"},
    {id:"e", text:"SSIS_LPBK_xxA_FINAL.dtsx publishes that data into APOLO..LPBK_xxA"},
    {id:"f", text:"SSIS_LPBK_xxA_MENU.dtsx has already orchestrated steps b–e as one scheduled job"},
    {id:"g", text:"An analyst reconciles APOLO..LPBK_01A totals against a comparison file like Data_Pembanding_LPK01A.xlsx before sign-off"}
  ],
  correctOrder:["a","b","c","d","e","f","g"],
  explanation:"You've now walked this path five separate times for three different reports — this is the same lifecycle, just told as one story. Note step 'f' isn't really a *separate* moment in time; the MENU package is what triggers b→e in the first place, it's included here to make sure you understand it wraps them rather than running after them. The final step matters just as much as the SSIS work: a pipeline is only 'done' once someone has reconciled the published numbers (like APOLO..LPBK_01A) against an independent expectation — which is exactly what a file like <code>Data_Pembanding_LPK01A.xlsx</code>, with its <code>Kode_Komponen</code>/<code>Individual</code> pairs per period, is for."
},

// ---------------------------------------------------------------
// 20. FILLBLANK — the commented aggregation query in intruksi.sql
// ---------------------------------------------------------------
{
  id:20, type:"fillblank", category:"SQL in Practice",
  title:"Rebuild the Reconciliation Query",
  prompt:"This exact query appears (commented out) in <code>intruksi.sql</code>, used to check Neraca totals per COA. Drag the correct keyword into each blank.",
  segments:[
    {text:"SELECT b.sandi, ROUND(SUM(Jumlah) / 1000000, 0) AS Jumlah\nFROM Staging_APOLO..Source_Neraca a\n"},
    {blank:"b1"},
    {text:" Ref_POSLaporanPosisikeuangan_Bulanan_Detail b\n"},
    {blank:"b2"},
    {text:" a.Pos_Neraca = b.COA\n"},
    {blank:"b3"},
    {text:" b.Sandi"}
  ],
  bank:["LEFT JOIN","INNER JOIN","ON","WHERE","GROUP BY","ORDER BY"],
  correct:{b1:"LEFT JOIN", b2:"ON", b3:"GROUP BY"},
  explanation:"This query rolls Source_Neraca amounts up to a millions-of-rupiah figure per COA code, for a quick sanity check. <code>LEFT JOIN</code> is deliberate, not accidental — using LEFT instead of INNER means a Neraca row with a Pos_Neraca code that *doesn't* match any COA in the reference table will still show up (with a NULL sandi) instead of silently disappearing, which is exactly the kind of thing you want surfaced during reconciliation, not hidden. <code>ON</code> defines the join condition, and <code>GROUP BY b.Sandi</code> is what makes the SUM() actually aggregate per code instead of returning one row per raw transaction."
},

// ---------------------------------------------------------------
// 21. FILLBLANK — filter by Pos_Neraca
// ---------------------------------------------------------------
{
  id:21, type:"fillblank", category:"SQL in Practice",
  title:"Filter Source_Neraca by Position Code",
  prompt:"Also from <code>intruksi.sql</code> — this is how you'd pull every Source_Neraca row belonging to a single balance-sheet position. Fill in the blanks.",
  segments:[
    {text:"SELECT * FROM Staging_APOLO..Source_Neraca\n"},
    {blank:"b1"},
    {text:" Pos_Neraca "},
    {blank:"b2"},
    {text:" '01.01.00.00.00.00'"}
  ],
  bank:["WHERE","HAVING","=","LIKE","<>"],
  correct:{b1:"WHERE", b2:"="},
  explanation:"<code>WHERE</code> is correct because we're filtering individual rows before any aggregation — there's no GROUP BY here, so <code>HAVING</code> wouldn't even be legal. <code>=</code> is correct (not <code>LIKE</code>) because <code>Pos_Neraca</code> is being compared to a complete, exact position code — '01.01.00.00.00.00' is Kas (Cash) in full, not a pattern to search within. Using <code>LIKE</code> here would still work in most engines but is slower and signals to other developers that a partial match was intended, which it wasn't."
},

// ---------------------------------------------------------------
// 22. FILLBLANK — two-part cross-database naming
// ---------------------------------------------------------------
{
  id:22, type:"fillblank", category:"SQL in Practice",
  title:"Cross-Database Table References",
  prompt:"<code>intruksi.sql</code> repeatedly writes things like <code>APOLO..Ref_Kantor</code>. Fill in the missing piece of that syntax.",
  segments:[
    {text:"-- Querying a table in a DIFFERENT database than the one you're connected to:\nSELECT * FROM APOLO"},
    {blank:"b1"},
    {text:"Ref_Kantor"}
  ],
  bank:["..","::","->",".","->>"],
  correct:{b1:".."},
  explanation:"In SQL Server, the full name of any table is actually four parts: <code>Database.Schema.Table</code> plus a rarely-used server prefix. When you skip the schema and write <code>APOLO..Ref_Kantor</code>, the double-dot is shorthand for 'use the default schema' — almost always <code>dbo</code>. So <code>APOLO..Ref_Kantor</code> really means <code>APOLO.dbo.Ref_Kantor</code>. This is exactly why <code>intruksi.sql</code> can write plain <code>select * from Ref_Kantor</code> (current database, default schema) right next to <code>select * from APOLO..Ref_Kantor</code> (explicitly the other database) without any conflict — they can be two physically different tables with the same name."
},

// ---------------------------------------------------------------
// 23. FILLBLANK — join penjualan to pelanggan
// ---------------------------------------------------------------
{
  id:23, type:"fillblank", category:"SQL in Practice",
  title:"Join the Practice Sales Tables",
  prompt:"Using CREATE_TABLE_TAMBAHAN.txt's <code>penjualan</code> and <code>pelanggan</code> tables — write a query that lists each invoice with the customer's first name.",
  segments:[
    {text:"SELECT p.nomor_faktur, c.nama_depan\nFROM penjualan p\n"},
    {blank:"b1"},
    {text:" pelanggan c\n"},
    {blank:"b2"},
    {text:" p.id_pelanggan = c.id_pelanggan"}
  ],
  bank:["INNER JOIN","GROUP BY","ON","WHERE","LEFT JOIN"],
  correct:{b1:"INNER JOIN", b2:"ON"},
  explanation:"<code>penjualan.id_pelanggan</code> is declared <code>NOT NULL</code> in the DDL — every sale is required to reference a real customer — so an <code>INNER JOIN</code> is safe and correct here; you won't lose any legitimate sales rows the way you might if the foreign key were optional. <code>ON</code> then states the actual relationship: match a sale's <code>id_pelanggan</code> to that customer's own primary key. This is the same join shape you'd use to attach a branch name from Ref_Kantor onto a Neraca row, or a COA description onto a Source_Neraca row — same skill, different tables."
},

// ---------------------------------------------------------------
// 24. FILLBLANK — branch-level validation aggregation
// ---------------------------------------------------------------
{
  id:24, type:"fillblank", category:"SQL in Practice",
  title:"Total Neraca Amounts Per Branch, For One Period",
  prompt:"Write the query a validator would run to check total Neraca amounts by branch for August 2025.",
  segments:[
    {text:"SELECT Kode_Cabang, SUM(Jumlah) AS Total\nFROM Staging_APOLO..Source_Neraca\n"},
    {blank:"b1"},
    {text:" Bulan_Data = '08' AND Tahun_Data = '2025'\n"},
    {blank:"b2"},
    {text:" Kode_Cabang"}
  ],
  bank:["WHERE","GROUP BY","HAVING","ORDER BY"],
  correct:{b1:"WHERE", b2:"GROUP BY"},
  explanation:"Row-level filtering (which period to look at) always comes before aggregation, so <code>WHERE Bulan_Data = '08' AND Tahun_Data = '2025'</code> narrows the table down to August 2025 first. Then <code>GROUP BY Kode_Cabang</code> collapses all remaining rows into one total per branch, letting <code>SUM(Jumlah)</code> compute each branch's grand total. This is the same shape of query an analyst runs constantly during month-end close — swap <code>Kode_Cabang</code> for <code>Kode_Komponen</code> and you get totals per report line instead of per branch."
},

// ---------------------------------------------------------------
// 25. FILLBLANK — check a specific published component
// ---------------------------------------------------------------
{
  id:25, type:"fillblank", category:"SQL in Practice",
  title:"Spot-Check One Published Line Item",
  prompt:"Write the query to pull the published value of one specific component ('1. Kas') for August 2025 straight out of the APOLO final table.",
  segments:[
    {text:"SELECT Individual\nFROM APOLO..LPBK_01A\nWHERE Kode_Komponen "},
    {blank:"b1"},
    {text:" '010101010000000000'\n"},
    {blank:"b2"},
    {text:" Bulan_Data = '08' AND Tahun_Data = '2025'"}
  ],
  bank:["=","LIKE","AND","OR","IN"],
  correct:{b1:"=", b2:"AND"},
  explanation:"<code>Kode_Komponen = '010101010000000000'</code> pins down the exact published line (in this schema that full 18-digit code is 'Kas' / Cash, the first leaf item under ASET). <code>AND</code> is required — not <code>OR</code> — because you need *both* conditions true at once: this specific component code, for this specific month and year. Swapping in <code>OR</code> would return every row for this component ever recorded, plus every row from August 2025 regardless of component — almost certainly not what a spot-check needs. This is exactly the kind of one-line query you'd run to confirm APOLO..LPBK_01A matches a number from Data_Pembanding_LPK01A.xlsx before sign-off."
}

];
