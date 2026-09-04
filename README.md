# Rebate Tracker starter

1. Run `schema.sql` in Supabase SQL Editor.
2. In Supabase Project Settings > API, copy the Project URL and anon/public key.
3. Put them into `config.js`.
4. Enable Email authentication in Supabase.
5. Open `index.html` locally or deploy this folder to a static host.
6. Never place the Supabase `service_role` key in `config.js`.

The SQL enables Row Level Security so authenticated users can only access rows where `user_id = auth.uid()`.

The app supports:
- multiple rebate periods/months
- add/edit/delete PLU programs
- qty sold + item price
- automatic sales and rebate calculations
- Excel export with a summary sheet and one sheet per PLU


## V2 Excel export

The export now uses ExcelJS and creates:
- `Rebate Summary Aug 2026` style summary sheet
- branded report header on every sheet
- month-year program heading (no header start/end date block)
- rebate totals section at top of summary
- detailed PLU summary table
- one sheet per PLU
- PLU tab naming: `PLU_Product_Aug_2026`, e.g. `78064_Cutwater4pk_Aug_2026`
- exported file naming: `Rebate_Summary_Aug_2026.xlsx`

Note: Excel worksheet names have a 31-character limit, so long product descriptions are compacted/truncated automatically.


## V3 changes

- Individual PLU worksheet names now use **Scan Program** rather than Description:
  `PLU_ScanProgram_Aug_2026`
- Rebate Summary detail columns are ordered:
  `PLU | Scan Program | Description | Size / Pack | Units Required | Rebate Amount | Start Date | End Date | Qty Sold | Sales Total | Qualifying Rebates | Total Rebate Due`


## V4 changes
- Added visible field labels to Add Rebate Program.
- Added visible field labels to New Period.
- Individual Excel tabs now use `PLU_MonthYear`, e.g. `64545_Jun2026`.
- Removed Unmatched Units from individual PLU sheet rebate summaries.

## V5 - Rebate Qualified Qty
- Qty Sold tracks total units sold.
- Rebate Qualified Qty tracks only units eligible for supplier rebate.
- Sales Total = Qty Sold × Item Price.
- Qualifying Rebates = floor(Rebate Qualified Qty ÷ Units Required).
- Rebate Due = Qualifying Rebates × Rebate Amount.
- Rebate Qualified Qty cannot exceed Qty Sold.
- Run `v5_migration.sql` once on an existing Supabase database.


## V5.1 Excel terminology changes

Excel export wording updated across the workbook:

Summary sheet:
- `REBATE SUMMARY` -> `SUMMARY`
- `Total Qualifying Rebates` -> `TOTAL QUALIFYING REDEMPTION`
- `TOTAL REBATE DUE FROM SUPPLIER` -> `TOTAL DUE`
- `Rebate Amount` -> `Redemption Amt`
- `Qualifying Rebates` -> `Qualifying Redemption`
- `Total Rebate Due` -> `Total Due`

Individual PLU sheets:
- `Rebate Amount` -> `Redemption Amount`
- `SALES & REBATE SUMMARY` -> `SALES & REDEMPTION SUMMARY`
- `Units Required per Rebate` -> `Units Required per Redemption`
- `Qualifying Rebates Earned` -> `Qualifying Redemption Earned`
- `Rebate Amount per Qualifying Purchase` -> `Redemption Amount per Qualifying Purchase`
- `TOTAL REBATE DUE` -> `TOTAL REDEMPTION DUE`

The web app field names remain unchanged; these wording changes apply to Excel export presentation.
