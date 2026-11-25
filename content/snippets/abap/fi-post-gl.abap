DATA: ls_header TYPE bapiaccahd,
      ls_line   TYPE bapiaccaitm,
      lt_lines  TYPE STANDARD TABLE OF bapiaccaitm,
      lt_return TYPE STANDARD TABLE OF bapiret2.

ls_header-companycode = p_bukrs.
ls_header-docdate     = p_budat.
ls_header-postingdate = p_budat.
ls_header-docstatus   = 'U'.

ls_line-itemno      = '1'.
ls_line-glaccount   = p_hkont.
ls_line-debitcredit = 'S'.
ls_line-amount      = p_amount.
ls_line-currency    = p_waers.
APPEND ls_line TO lt_lines.

CALL FUNCTION 'BAPI_ACC_DOCUMENT_POST'
  EXPORTING
    documentheader         = ls_header
  TABLES
    accountingdocumentline = lt_lines
    return                 = lt_return.

CALL FUNCTION 'BAPI_TRANSACTION_COMMIT'
  EXPORTING
    wait = abap_true.

LOOP AT lt_return INTO DATA(ls_return) WHERE type = 'E'.
  MESSAGE ls_return-message TYPE 'E'.
ENDLOOP.
