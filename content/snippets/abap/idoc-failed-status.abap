PARAMETERS: p_from TYPE edidc-credat.

SELECT docnum, status, messty, credat
  FROM edidc
  INTO TABLE @DATA(lt_idocs)
  WHERE status IN ( '30', '51', '64' )
    AND credat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No failed IDocs found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_idocs INTO DATA(ls_idoc).
  WRITE: / ls_idoc-docnum, ls_idoc-messty,
           ls_idoc-status, ls_idoc-credat.
ENDLOOP.
