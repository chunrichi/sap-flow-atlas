PARAMETERS: p_ebeln TYPE ekbe-ebeln,
            p_from  TYPE ekbe-budat.

DATA: lt_history TYPE STANDARD TABLE OF ekbe,
      ls_history TYPE ekbe.

SELECT ebeln, ebelp, bwart, menge, dmbtr, budat
  FROM ekbe
  INTO TABLE @lt_history
  WHERE ebeln = @p_ebeln
    AND budat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No PO history found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_history INTO ls_history.
  WRITE: / ls_history-ebeln, ls_history-ebelp,
           ls_history-bwart, ls_history-menge,
           ls_history-dmbtr, ls_history-budat.
ENDLOOP.
