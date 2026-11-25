PARAMETERS: p_werks TYPE qals-werks,
            p_from  TYPE qals-ersdat.

SELECT prueflos, matnr, werks, losmenge, ersdat
  FROM qals
  INTO TABLE @DATA(lt_lots)
  WHERE werks = @p_werks
    AND ersdat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No inspection lots found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_lots INTO DATA(ls_lot).
  WRITE: / ls_lot-prueflos, ls_lot-matnr,
           ls_lot-losmenge, ls_lot-ersdat.
ENDLOOP.
