PARAMETERS: p_from  TYPE aufk-erdat,
            p_auart TYPE aufk-auart.

SELECT a~aufnr, a~auart, a~erdat, a~objnr,
       i~matnr, i~psmng, i~wmeng
  FROM aufk AS a
  INNER JOIN afpo AS i ON i~aufnr = a~aufnr
  INTO TABLE @DATA(lt_orders)
  WHERE a~auart = @p_auart
    AND a~erdat >= @p_from.

IF sy-subrc <> 0.
  MESSAGE 'No production orders found' TYPE 'I'.
  RETURN.
ENDIF.

LOOP AT lt_orders INTO DATA(ls_order).
  WRITE: / ls_order-aufnr, ls_order-matnr,
           ls_order-psmng, ls_order-wmeng.
ENDLOOP.
