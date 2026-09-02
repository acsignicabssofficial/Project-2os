================================================================================
HOW TO DEPLOY 2OS PHILIPPINE ACCOUNTING TO INFINITYFREE WEB HOSTING
================================================================================

This web application has been fully re-engineered to run natively on InfinityFree LAMP stack (Apache + PHP + MySQL).

--------------------------------------------------------------------------------
STEP 1: CREATE YOUR FREE ACCOUNT & DATABASE ON INFINITYFREE
--------------------------------------------------------------------------------
1. Go to https://infinityfree.com and log in to your account.
2. Go to your Account Control Panel (vPanel / VistaPanel).
3. Under "Databases", click "MySQL Databases".
4. Create a new database name, e.g. "accounting" or "ledger".
5. Note down your MySQL details:
   - MySQL Host Name (e.g. sql100.infinityfree.com or sql302.epizy.com)
   - MySQL User Name (e.g. epiz_12345678)
   - MySQL Password  (Your vPanel / account password)
   - MySQL Database  (e.g. epiz_12345678_accounting)

--------------------------------------------------------------------------------
STEP 2: IMPORT THE DATABASE SCHEMA VIA PHPMYADMIN
--------------------------------------------------------------------------------
1. In InfinityFree Control Panel, click on "phpMyAdmin".
2. Select your newly created database from the left sidebar.
3. Click the "Import" tab at the top.
4. Click "Choose File" and select "infinityfree_database.sql".
5. Click "Go" at the bottom right.
   -> All 10 database tables and standard Chart of Accounts will be created!

(Alternative: If you cannot access phpMyAdmin, simply open your website at
 https://yourdomain.com/api/setup_db.php to create the tables automatically!)

--------------------------------------------------------------------------------
STEP 3: CONFIGURE YOUR MYSQL CREDENTIALS
--------------------------------------------------------------------------------
Open the file "api/db_config.php" and update lines 24-27 with your credentials:

  define('DB_HOST', 'sql100.infinityfree.com');
  define('DB_USER', 'epiz_12345678');
  define('DB_PASS', 'YourPasswordHere');
  define('DB_NAME', 'epiz_12345678_accounting');

--------------------------------------------------------------------------------
STEP 4: UPLOAD FILES TO HTDOCS VIA FILE MANAGER OR FILEZILLA FTP
--------------------------------------------------------------------------------
1. In InfinityFree, open "Online File Manager" (or connect via FileZilla FTP).
2. Open the "htdocs" directory (delete the default index2.html if present).
3. Upload all files from this package directly inside "htdocs/":
   - index.html
   - .htaccess
   - assets/ (all JS & CSS bundles)
   - api/ (all PHP API scripts)
   - infinityfree_database.sql

--------------------------------------------------------------------------------
STEP 5: LAUNCH & TEST
--------------------------------------------------------------------------------
1. Visit your website: https://yourdomain.epizy.com/
2. Click the "InfinityFree & Cloud DB" button in the top navigation bar.
3. Click "Test InfinityFree MySQL Connection" to verify the live database.
4. All transactions, BIR 2303 compliance, sales, collections, expenses, and
   payroll are now 100% functional and stored in your InfinityFree MySQL!

================================================================================
