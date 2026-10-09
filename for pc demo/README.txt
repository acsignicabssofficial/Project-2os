=============================================================================
2OS ACCOUNTING SYSTEM - PC DEMO & SQL DATABASE MANAGER
Tagalog: Pagtutuos / Tuos (2 Parties, Orient, Support)
=============================================================================

PAANO PATAKBUHIN SA IYONG WINDOWS PC:
-----------------------------------------------------------------------------
1. I-double click ang "Launch_App.bat".
2. Kusang magbubukas ang 2OS Accounting System sa sarili nitong application window at magsasara agad ang command prompt!
3. Hindi mo kailangang mag-install ng Node.js o kumplikadong server — ang kasamang
   Python application ("app.py") ang mismong nagpapatakbo ng database at server!

SQL DATABASE FILE ("transactions.sql"):
-----------------------------------------------------------------------------
- Ang folder na ito ay may kasamang "transactions.sql".
- Sa tuwing magdadagdag ka ng:
  * Sales Invoice
  * Collection (BIR 2307)
  * Expense Voucher / APV
  * Check Disbursement / Payment
  * General Journal Entry / Adjustment
  * Payroll Record
- Awtomatikong ise-save ng Python engine ang data sa lokal na SQLite database
  ("2os_database.db") AT iu-update agad ang "transactions.sql"!
- Pwede mong buksan ang "transactions.sql" gamit ang Notepad, VS Code,
  DBeaver, MySQL Workbench, o i-import sa kahit anong standard SQL database!

REQUIREMENTS:
-----------------------------------------------------------------------------
- Windows 10 o Windows 11 (May built-in Microsoft Edge para sa dedicated app window).
- Python 3.8 o mas bago (libre sa https://www.python.org/downloads/).
  Tandaan: I-check ang "Add Python to PATH" habang nag-i-install.
- Opsyonal: Kung gusto mo ng native embedded OS window, mag-run ng:
  pip install -r requirements.txt

MGA KASAMANG FILES SA FOLDER NA ITO:
-----------------------------------------------------------------------------
- Launch_App.bat    : Ang nag-iisang Windows Batch launcher (I-double click para buksan ang app)
- app.py            : Python script na nagbubukas ng window at namamahala sa SQL database
- transactions.sql  : SQL file na naglalaman ng lahat ng tables at transactions
- 2os_database.db   : SQLite binary database cache (kusang nabubuo)
- web/              : Web application user interface files
- requirements.txt  : Opsyonal na pip requirements (pywebview)
- README.txt        : Ang gabay na ito

=============================================================================
Salamat sa paggamit ng 2OS Accounting System!
=============================================================================
